#!/bin/bash
#
# UNCP - Calcula los totales que muestra el bloque "Estadisticas" del pie de
# pagina y los deja en un archivo estatico que lee el navegador
# (assets/custom/uncp-pie-estadisticas.js).
#
# Desde la reconstruccion del frontend (tema "uncp") tambien calcula los
# documentos de cada comunidad de primer nivel, para las tarjetas de la
# portada (campo "comunidades_inicio"). Lo leen UncpTotalesService del tema y,
# sin problema, el script actual del pie, que ignora ese campo.
# Copia versionada: servidor/uncp_totales_pie.sh del repositorio del frontend.
#
# Solo hace consultas de lectura a la API REST y a Solr locales. Si alguna
# falla, conserva el archivo anterior.
#
# Cron (usuario dspace):
#   0 5 * * * /opt/dspace/scripts/uncp_totales_pie.sh >> /opt/dspace/log/uncp_totales_pie.log 2>&1

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
set -u

API="${UNCP_API:-http://127.0.0.1:8080/server/api}"
SOLR="${UNCP_SOLR:-http://localhost:8983/solr/search}"
DESTINO="${UNCP_DESTINO:-/var/www/dspace-angular/assets/custom/uncp-totales.json}"

log() { echo "$(date '+%F %T') $*"; }

# Total de elementos de un listado de la API, consultado sin sesion:
# cuenta lo mismo que ve un visitante.
total_api() {
  curl -sf -m 60 "$API/$1" | grep -oE '"totalElements" *: *[0-9]+' | head -1 | grep -oE '[0-9]+$'
}

# Nombres distintos en dc.contributor.author y dc.creator (sin asesores)
# entre los items publicos.
total_autores() {
  curl -sf -m 60 -G "$SOLR/select" \
    --data-urlencode 'q=search.resourcetype:Item AND archived:true AND withdrawn:false AND discoverable:true' \
    --data-urlencode 'rows=0' \
    --data-urlencode 'omitHeader=true' \
    --data-urlencode 'json.facet={autores:"unique(author_keyword)"}' \
    | grep -oE '"autores" *: *[0-9]+' | head -1 | grep -oE '[0-9]+$'
}

# UNCP - conteos por comunidad (tarjetas de la portada).
# Objeto JSON {"<uuid>": documentos, ...} con las comunidades de primer nivel,
# contando lo que ve un visitante (incluye subcomunidades y colecciones).
# Si falla una comunidad, se omite solo esa; si falla el listado, queda {}.
# En ningun caso impide escribir los totales del pie.
conteos_comunidades() {
  local uuids uuid n json="" sep=""
  uuids=$(curl -sf -m 60 "$API/core/communities/search/top?size=100" \
    | grep -oE '"uuid" *: *"[0-9a-f-]{36}"' | grep -oE '[0-9a-f-]{36}')
  for uuid in $uuids; do
    n=$(total_api "discover/search/objects?dsoType=item&scope=$uuid&size=1")
    if [[ "$n" =~ ^[1-9][0-9]*$ ]]; then
      json="$json$sep\"$uuid\": $n"
      sep=", "
    else
      log "AVISO: sin conteo valido para la comunidad $uuid; se omite" >&2
    fi
  done
  printf '{%s}' "$json"
}

documentos=$(total_api 'discover/search/objects?dsoType=item&size=1')
comunidades=$(total_api 'core/communities?size=1')
colecciones=$(total_api 'core/collections?size=1')
autores=$(total_autores)
comunidades_inicio=$(conteos_comunidades)

for par in "documentos=$documentos" "autores=$autores" "comunidades=$comunidades" "colecciones=$colecciones"; do
  if ! [[ "${par#*=}" =~ ^[1-9][0-9]*$ ]]; then
    log "ERROR: cifra no valida (${par}); se conserva el archivo anterior"
    exit 1
  fi
done

TMP="$DESTINO.tmp.$$"
if ! printf '{"documentos": %s, "autores": %s, "comunidades": %s, "colecciones": %s, "comunidades_inicio": %s, "actualizado": "%s"}\n' \
     "$documentos" "$autores" "$comunidades" "$colecciones" "$comunidades_inicio" "$(date '+%Y-%m-%dT%H:%M:%S%:z')" > "$TMP"; then
  log "ERROR: no se pudo escribir $TMP"
  rm -f "$TMP"
  exit 1
fi
chmod 644 "$TMP"
if ! mv -f "$TMP" "$DESTINO"; then
  log "ERROR: no se pudo reemplazar $DESTINO"
  rm -f "$TMP"
  exit 1
fi

log "OK documentos=$documentos autores=$autores comunidades=$comunidades colecciones=$colecciones comunidades_inicio=$(grep -o ':' <<< "$comunidades_inicio" | wc -l)"
