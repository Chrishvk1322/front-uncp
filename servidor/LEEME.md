# Archivos para el servidor de producción (UNCP)

Esta carpeta contiene archivos que **no forman parte del build del frontend**. Se copian al servidor a mano. Están aquí para que queden versionados junto al frontend que los usa.

## `uncp_totales_pie.sh` — totales del pie y de las tarjetas de la portada

- **Destino en el servidor:** `/opt/dspace/scripts/uncp_totales_pie.sh`. Se reemplaza el archivo completo.
- **Cron:** el de siempre, sin cambios: `0 5 * * *`, usuario `dspace`.
- **Qué cambia respecto a la versión actual:** es la misma versión que corre en producción (anexo C de `frontend-personalizacion.md`), más el campo `comunidades_inicio`. Ese campo guarda los documentos de cada comunidad de primer nivel y lo usan las tarjetas de la portada del tema `uncp`.
- **Compatibilidad:** se puede aplicar **antes** de desplegar el frontend nuevo. El script actual del pie (`uncp-pie-estadisticas.js`) ignora el campo nuevo.
- **Consultas que hace:** 1 para listar las comunidades de primer nivel y 1 por comunidad (8 hoy). Son locales, sin sesión, una vez al día.
- **Si falla un conteo:** se omite solo esa comunidad, o queda `{}` si falla el listado. Los totales del pie se escriben igual, con su validación de siempre.

Formato resultante:

```json
{"documentos": 14626, "autores": 18159, "comunidades": 54, "colecciones": 104,
 "comunidades_inicio": {"3ab747e7-e5e3-45f3-b947-d3ae80e507d8": 3525, "...": 1598},
 "actualizado": "2026-10-25T05:00:01-05:00"}
```

### Pasos para aplicarlo

```bash
cd /opt/dspace/scripts
cp -p uncp_totales_pie.sh uncp_totales_pie.sh.bak-$(date +%F)    # 1. respaldo
# 2. copiar aquí la versión nueva (servidor/uncp_totales_pie.sh del repositorio)
chmod 755 uncp_totales_pie.sh
bash -n uncp_totales_pie.sh && echo "sintaxis OK"                  # 3. sintaxis
UNCP_DESTINO=/tmp/uncp-totales-prueba.json ./uncp_totales_pie.sh   # 4. prueba, sin tocar el archivo publicado
cat /tmp/uncp-totales-prueba.json                                  #    debe traer comunidades_inicio con 8 cifras
./uncp_totales_pie.sh                                              # 5. ejecución real (como usuario dspace)
curl -s https://repositorio.uncp.edu.pe/assets/custom/uncp-totales.json
```

**Vuelta atrás:** restaurar `uncp_totales_pie.sh.bak-<fecha>` y ejecutarlo una vez.

Probado el 25/10/2026 contra la API real (solo lectura), con Solr simulado para el conteo de autores: genera las 8 comunidades con los conteos de la búsqueda.

## Al desplegar el frontend nuevo: ruta fija para el JSON

Hoy `uncp-totales.json` vive dentro del build (`/var/www/dspace-angular/assets/custom/`), pero no forma parte de él. Un despliegue que reemplace la carpeta lo borraría hasta las 05:00 siguientes. Con SSR, además, Node podría responder con la página de Angular en lugar del JSON. Recomendación (`frontend-personalizacion.md`, 7.4 paso 6):

```nginx
location /assets/custom/ {
    alias /opt/dspace/uncp-public/;   # carpeta fija, fuera del build
}
```

Orden sin corte:
1. Crear `/opt/dspace/uncp-public/`, propiedad de `dspace`, con permisos `755`.
2. Ejecutar el cron una vez con `UNCP_DESTINO=/opt/dspace/uncp-public/uncp-totales.json`.
3. Agregar el `location`, y luego `nginx -t` y `systemctl reload nginx`.
4. Cambiar `DESTINO` en el script, o definir `UNCP_DESTINO` en la línea del cron.
5. Verificar con `curl -sI https://repositorio.uncp.edu.pe/assets/custom/uncp-totales.json`: debe dar `200` y `application/json`.
