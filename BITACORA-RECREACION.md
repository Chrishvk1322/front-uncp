# Bitácora — Recreación del frontend de producción (repositorio.uncp.edu.pe)

Última actualización: 2026-10-24.

## 1. Objetivo

Recrear en este repo (`dspace-angular`, base **7.6.5**) el diseño personalizado que corre en producción (`repositorio.uncp.edu.pe`), partiendo solo de artefactos compilados/minificados (no existe el código fuente original).

## 2. Estado actual (resumen)

- La **página de inicio** está recreada completa y verificada (ver sección 5).
- Ajustes extra pedidos por el usuario (no venían de producción): contenedor principal al 80% del ancho y navbar 30% más grande.
- **Pendiente principal**: analizar a fondo las páginas de comunidad/colección y de búsqueda (sección 7).
- Nada está commiteado en git todavía (el usuario no lo ha pedido).
- **Todo vive en un tema propio `uncp`** (`src/themes/uncp/`, migrado el 2026-10-24, ver sección 5b). El tema de ejemplo `dspace` y `src/app/` volvieron a su versión original, salvo 3 archivos del núcleo que no se pueden sobrescribir desde un tema. Respaldo del estado anterior a la migración en `~/.local/uncp-backup/` (`pre-uncp-theme.patch` + `pre-uncp-theme-untracked.tgz`).

## 3. Material de partida

- `recuperado/dspace-compilado/dspace-angular/`: el `dist/` completo de producción — chunks `.js`, `base-theme.css`, `dspace-theme.css`, `custom-theme.css`, `index.html` y `assets/` (imágenes, fuentes, i18n, `config.json`).
- `recuperado/replica/REPLICA REPOSITORIO/`: páginas guardadas desde el navegador del sitio en producción: Inicio, Buscar y 8 páginas de comunidades.
- `recuperado/uncp-home.png`: captura completa de la home de producción (la referencia visual principal).

## 4. Hallazgos clave

### Producción corre DSpace 7.6.0, no 7.6.5
- Font Awesome 6.4.0 en producción → coincide con 7.6.0–7.6.2 (7.6.3+ usa 6.7.2).
- La estructura del header (`<header class="header"><nav class="container navbar navbar-expand-md px-0">`) coincide exactamente con la tag `dspace-7.6`.
- Consecuencia: muchas diferencias entre este repo y producción son solo evolución de versión de DSpace, no personalización de UNCP.

### Lo que NO fue personalizado
- Colores y tipografía del tema (`$primary:#43515f`, `$success:#92c642`, `$info:#207698`, Nunito): son los valores stock del tema `dspace`.
- Traducciones i18n: las diferencias con el stock son typos/capitalización entre versiones.
- `custom/i18n/en.json5` de producción solo tiene 2 overrides de ejemplo de la documentación de DSpace; no se aplicó nada.

### Lección de método
Comparar plantillas stock entre versiones **no alcanza** para descartar personalización. UNCP editó a mano componentes "base" que siguen usando el mismo tag `ds-*`. Hay que extraer el HTML realmente renderizado de la réplica (o capturas) **sección por sección** y el CSS embebido en los chunks JS. Un primer análisis que solo hizo lo primero concluyó erróneamente que había "solo 3 cambios".

## 5. Personalizaciones implementadas (home)

Rutas relativas a `src/themes/uncp/app/` salvo que se indique otra cosa.

| # | Qué | Archivo(s) en el tema | Notas |
|---|-----|-----------|-------|
| 1 | Logo del header → `logo.png` | `header/header.component.html` | |
| 2 | Navbar con enlaces propios: Repositorio, Tutoriales (dropdown con 4 links), Reglamento, Estadísticas | `navbar/navbar.component.html` | Reemplaza las secciones dinámicas; dropdown con `ngbDropdown` |
| 3 | Carrusel hero de 3 slides (`P1/P2/P3.png`), "Repositorio Institucional Digital" | `home-page/home-news/home-news.component.{html,ts,scss}` | Requiere jQuery + Bootstrap JS por CDN en `src/index.html` (núcleo, igual que producción). El `.ts` inicia el carrusel en `ngAfterViewInit` (Bootstrap solo autoinicia en `window.load`, y Angular dibuja la home después). El `.scss` tiene el CSS real de producción |
| 4 | Buscador con sombra, fondo claro y botón verde (`btn-success`) | `shared/search-form/search-form.component.{ts,html}` | Aplica en la home y en la búsqueda, igual que en producción |
| 5 | Grid de 8 tarjetas de comunidades con ícono, color y conteo | `home-page/top-level-community-list/top-level-community-list.component.{ts,html,scss}` | Listado stock queda oculto (`d-none`). Datos **hardcodeados** en `communityCards` del `.ts` del tema (los conteos se desactualizan; editar a mano) |
| 6 | Tarjetas de publicaciones: título y autores en negrita, badge de tipo traducido (`tipoItem()` sobre `dc.type`), fecha (`dc.date.issued`), "Ver todos los metadatos" y badge de acceso según `dc.rights` (`hasRights()`: abierto/embargado/restringido). Sin "Más..." (`[showToggle]="false"`) | `shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component.{ts,html,scss}` | Registrado con `@listableObjectComponent(..., 'uncp')`: aplica en home, búsqueda y listados. Plantilla y lógica recuperadas del bundle `main.*.js` de producción. Usa `ds-themed-thumbnail` para que tome la miniatura del tema |
| 6b | Miniatura por defecto `PORTADA.png` cuando el ítem no tiene miniatura | `thumbnail/thumbnail.component.{ts,html,scss}` | La clase `default-cover` anula el espaciador A4 que trae 7.6.5 (en 7.6.0 no existía) |
| 6c | Resúmenes en cursiva, cortados a 3 líneas | `src/themes/uncp/styles/_global-styles.scss` (`ds-truncatable-part .content`) | En producción estaba en el CSS del componente `truncatable-part`, que no se puede sobrescribir desde un tema |
| 6d | "Publicaciones recientes": `h3` con subrayado verde, botón "Cargar más" verde a la derecha | `home-page/recent-item-list/recent-item-list.component.{ts,html,scss}` | El stock no es sobrescribible: el del tema tiene selector propio `ds-uncp-recent-item-list` y lo usa la home del tema. `w-100` en el contenedor (con datos cortos se encogía) |
| 6e | Header derecho: lupa e idioma en verde (`text-success fs-5`), "Iniciar sesión" como botón verde con ícono | `search-navbar/…`, `shared/lang-switch/…`, `shared/auth-nav-menu/…` | El `.ts` de `search-navbar` trae su propia animación con el campo de 210px |
| 6f | Textos en español: "Publicaciones recientes", título de pestaña "Repositorio Institucional UNCP :: …", `<title>` del `index.html` | `src/assets/i18n/es.json5`, `src/index.html` (núcleo) | En el primer análisis solo se había comparado el i18n en inglés |
| 7 | Sub-footer: carrusel infinito de plataformas (Google Scholar, Scopus, ALICIA, Open Access, LA Referencia, Web of Science) | `home-page/sub-footer/*`, `home-page/home-page.component.{ts,html}` | Componente 100% nuevo, declarado en el `lazy-theme.module.ts` del tema |
| 8 | Footer oscuro "modern-footer" | `footer/footer.component.{ts,html,scss}` | CSS recuperado byte-fiel del chunk JS |

Reglas globales del tema en `src/themes/uncp/styles/_global-styles.scss`: copia **en orden** del tramo final de `dspace-theme.css` de producción (todo lo que viene después de las reglas stock `.facet-filter`). Incluye `.fs-1…8`, `.fw-*`, `.vertical-center`, colores redefinidos (`.text-success #067a5a`, `.text-primary #2a7eff`, `.text-danger`, `.bg-success` degradado esmeralda, `.bg-danger`, `.bg-light #f2f4f6`), `.bg-success-light`, `.bg-success-badge`, `.bg-footer`, y `.container { max-width: 1350px }`. **Ese tramo final es la forma confiable de ver lo que UNCP agregó al tema global**: comparar solo nombres de clases no detecta las redefiniciones de clases que ya existen en Bootstrap.

Footer: se quitó el enlace "Configuración de cookies" de la barra inferior porque producción no lo tiene. El aviso de cookies inicial (Klaro) sigue funcionando, pero el usuario ya no puede reabrir sus preferencias desde el footer.

**Ojo con homónimos**: el componente stock y el del tema comparten selector (`ds-home-news`). En los chunks hay dos definiciones; hay que tomar la que contiene el markup real (p.ej. buscando `carouselExampleCaptions`), no la primera que aparece.

Assets (en `src/themes/uncp/assets/`, se publican como `assets/uncp/...`):
- `images/`: `logo.png`, `logo-blanco.png`, `uncp-logo.png`, `dspace-logo2.png`, `P1-P3.png`, `PORTADA.png`, `PORTADA2.png`, `partners/*.png`, banners, `bg.png`, favicons.
- `icons/1-8.png` (íconos de las tarjetas de comunidad).

Verificación: compilado en modo SSR y comprobado con `curl` que el HTML final contiene todo lo anterior; el usuario lo revisó visualmente en `http://localhost:4000`.

## 5b. Estructura: tema `uncp` (desde 2026-10-24)

- **Tema**: `src/themes/uncp/`. Nació como copia del tema `dspace` ya personalizado; luego se le agregaron los componentes que antes estaban modificados en `src/app/`. Es independiente (no usa `extends`).
- **Cómo se sobrescribe un componente**: una clase en el tema que extiende la del núcleo, con el mismo selector y su propio `templateUrl`/`styleUrls` (si no cambian, apuntan a los del núcleo). Hay que redeclarar `animations` y `changeDetection`, porque Angular no hereda los metadatos del decorador. Patrón tomado del tema de ejemplo `custom`.
- **Registro**:
  - `eager-theme.module.ts` (header, navbar, home-news, footer, search-navbar, lang-switch, y como entry components el registro de resultados y las tarjetas de comunidades);
  - `lazy-theme.module.ts` (home, recent-item-list, sub-footer, search-form, auth-nav-menu, thumbnail);
  - `src/themes/eager-themes.module.ts` importa el módulo eager del tema;
  - `angular.json` agrega el bundle de estilos `uncp-theme`;
  - `config/config.yml` activa el tema con `themes: - name: uncp` y los favicons en `assets/uncp/images/favicons/`.
- **Producción**: su `config.json` actual dice `name: dspace`. Al desplegar este código hay que poner el tema `uncp` en la config de producción (`config.prod.yml` o variables de entorno), si no se verá el DSpace de serie.
- **Lo único que queda en el núcleo** (no se puede sobrescribir desde un tema; revisar en cada actualización de DSpace):
  1. `src/index.html`: jQuery + Bootstrap JS por CDN (carrusel) y `<title>`.
  2. `src/assets/i18n/es.json5`: 3 textos de UNCP. Los i18n de un tema no se cargan automáticamente.
  3. `src/app/shared/form/builder/.../dynamic-lookup-relation-search-tab.component.html`: se quitó `data-toggle="dropdown"`, que choca con el Bootstrap JS de `index.html` (ver sección 6).
- **Verificado tras la migración**:
  - Compilación y lint del tema limpios.
  - En el HTML aparece `data-used-theme="uncp"`.
  - Home idéntica a la de antes.
  - Colores de botones, lupa, globo y autores exactos.
  - Desplegables de idioma, Tutoriales y login abren.
  - Buscador del header de 210px sin superposición.
  - Sin "Más..." en home ni en búsqueda.
  - Título "Repositorio Institucional UNCP :: Inicio".
  - En `/search`, los registros y miniaturas salen del tema.

## 6. Ajustes pedidos por el usuario (no vienen de producción)

- **Contenedor principal ≥ 80% del ancho**: `#main-content .container { max-width: max(<ancho bootstrap>, 80vw) }` por breakpoint en `_global-styles.scss`. Nunca angosta respecto al original.
- **Navbar más grande** (pedido dos veces): en `_theme_css_variable_overrides.scss`, `--ds-header-height` 80→128px y `--ds-header-logo-height` 40→80px (móvil: 128px / 72px). En `_global-styles.scss`, los enlaces (`#main-site-navigation`) a `font-size: 1.6rem` y semibold, con `.dropdown-menu` reseteado a `1rem`. La parte derecha (lupa, idioma, login) queda con los tamaños de producción. En producción el header mide ~100px, el logo 60px y los enlaces 1.1rem; aquí se dejaron más grandes a pedido. **Reducido el 2026-10-24** ("se ve algo grande"): header 104px y logo 66px (móvil 96/60); enlaces `clamp(1rem, 1.3vw, 1.35rem)`; logos por rango 58/54/50/44px. Sin solape del buscador de 768 a 1920px.
- Header con los colores de producción: enlaces oscuros (`--ds-navbar-link-color: #343a40`, hover verde) y sombra suave abajo en lugar de la línea verde de 5px.
- **Header en una sola línea**: con los enlaces grandes, en pantallas angostas (≈1024px o menos) la parte derecha (lupa, idioma, login) pasaba a una segunda línea y quedaba oculta bajo el alto fijo del header. Ahora `#main-site-header-container` usa `flex-wrap: nowrap`, el tamaño de los enlaces es `clamp(1.1rem, 1.55vw, 1.6rem)` (ahora `clamp(1rem, 1.3vw, 1.35rem)`) y entre 768 y 1100px se ocultan "Tutoriales" y "Reglamento" (igual que en producción) y el logo baja a 60px. Probado a 800, 1024, 1265, 1366, 1536 y 1920px.
- **Distribución del header y buscador sin superposición** (todo en el bloque `#main-site-header` de `_global-styles.scss`):
  - El campo de la lupa se abre hacia la izquierda en posición absoluta y no debe tapar los enlaces en ningún ancho.
  - Contenedor del header: `max-width: 1760px`, más ancho que el de 1350px del contenido, así el grupo izquierdo queda más a la izquierda en pantallas grandes.
  - Separación entre logo y enlaces, y entre enlaces: `clamp(1rem, 1.45vw, 2rem)`, de 16 a 32px según el ancho (pedido del usuario: menos juntos).
  - Campo de búsqueda abierto: 210px (antes 250px; animación propia en `src/themes/uncp/app/search-navbar/search-navbar.component.ts`; el `slide.ts` del núcleo quedó stock).
  - Ajustes por rango de ancho:
    - 768–860px: separación 0.5rem, logo 48px, campo 130px.
    - 768–1023px: texto 1rem, logo 56px, campo 160px.
    - 768–1140px: se ocultan "Tutoriales" y "Reglamento" (producción lo hacía hasta 1100px) y el logo baja a 60px.
    - 1141–1260px: texto 1.05rem, logo 64px.
  - Medido con `~/.local/pwtool/overlap.js` (variable `WIDTHS`) de 768 a 1920px: sin superposición en ninguno. Los casos más justos son 1141px (18px libres) y 1265px (20px libres).
- **Colores indicados por el usuario**: login y "Buscar" `#26B269` con texto blanco (`#1f9a5a` al pasar el mouse, con foco o abierto); lupa y globo `#067A5A` (`.text-success`); autores `#158264`. Verificados con el color calculado en el navegador. Ojo: hace falta el selector con `button` porque Bootstrap tiene `button.bg-success:hover/:focus { … !important }`.
- **Footer con más espaciado**: más relleno en `.footer-main` (5rem arriba, 3rem abajo) y más separación en logo, descripción, contacto, títulos, enlaces y tarjetas de estadísticas.
- **Conflicto de desplegables por el JS de Bootstrap**: al cargar jQuery + Bootstrap JS (necesarios para el carrusel), los botones que tenían a la vez `ngbDropdownToggle` y `data-toggle="dropdown"` se abrían y cerraban en el mismo clic. Le pasaba al selector de idioma y al desplegable de resultados del formulario de depósito. Se quitó `data-toggle="dropdown"`, que sobraba. Si aparece otro desplegable que "no abre", revisar esto primero.
- **Sin "Más..." en los registros** (2026-10-24): `[showToggle]="false"` en los dos `ds-truncatable-part` del registro de resultados. Resumen y autores siguen cortados (3 y 1 líneas), pero no se expanden.
- Diferencia consciente con la referencia: en `uncp-home.png` el carrusel y el contenido llegan casi de borde a borde (contenedor de 1350px). Aquí `#main-content` usa `max(<bootstrap>, 80vw)`, que el usuario aprobó, así que en pantallas de ~1265px queda algo más angosto que en la captura.

## 7. Pendiente

0. **Siguiente paso acordado**: dentro del tema, pasar las etiquetas de `dc.type` (`tipoItem()`) y `dc.rights` (3 bloques `ngIf`) a tablas de mapeo compartidas con textos en i18n, y dejar un solo bloque en la plantilla. Se verá igual en español; ya no es copia literal de producción, pero queda más ordenado.
1. **Páginas de comunidad/colección y búsqueda**: aplicar el mismo método de la sección 4 (extraer HTML real de la réplica + CSS de los chunks). Es probable que tengan más personalización.
2. Confirmar si los estilos de los componentes compartidos (buscador, tarjetas de ítems) aplican igual fuera de la home en producción.
3. `config.yml` vs `config.json` de producción: producción tiene `mediaViewer` desactivado, `vocabularies` con `srsc`, `handle.prefix: 20.500.12894`. Son de despliegue, no de diseño; alinear si se quiere réplica funcional.
4. `PORTADA.png` / `PORTADA2.png`: copiadas, sin referencia en el código (probablemente contenido subido al backend).
5. Commitear los cambios cuando el usuario lo pida.

## 8. Cómo compilar, levantar y revisar

### Por qué hace falta un proxy
`config.yml` apunta a `demo.dspace.org`. Si el navegador lo consulta directamente desde `localhost`, el backend lo bloquea por CORS y la app salta a la página **500** apenas Angular arranca en el cliente (el HTML inicial del SSR se ve un instante y luego cae). Para revisar en un navegador real se usa un proxy local que sirve todo desde un mismo origen.

**Proxy de desarrollo** (fuera del repo): `~/.local/dspace-dev-proxy/proxy.js`, escucha en `http://localhost:8080`:
- `/server/**` → `https://demo.dspace.org`, reescribiendo las URLs absolutas del backend en el JSON y en los parámetros de consulta, y quitando las cabeceras `Origin`/`Referer` (con ellas DSpace responde 403).
- Todo lo demás → el SSR en `http://localhost:4000`.
- Usa `express` y `http-proxy-middleware` del `node_modules` del repo.
- `REMOTE=https://otro.servidor` permite apuntar a otro backend. Para el backend real de producción, usar el modo solo lectura descrito más abajo.

### Compilar y levantar
```bash
cd /home/chris/dspace-angular
rm -rf dist .angular/cache
NODE_OPTIONS="--max-old-space-size=10240" yarn run build:prod     # build:prod, NO build:ssr directo

# en llamadas separadas:
node ~/.local/dspace-dev-proxy/proxy.js &
DSPACE_REST_SSL=false DSPACE_REST_HOST=localhost DSPACE_REST_PORT=8080 DSPACE_REST_NAMESPACE=/server \
  NODE_OPTIONS="--max-old-space-size=4096" node dist/server/main &
# abrir http://localhost:8080  (no el 4000)
```
Las variables `DSPACE_REST_*` hacen que la app use el proxy sin tocar `config.yml`. Logs en `~/.local/dspace-dev-proxy/logs/` (`proxy.log`, `ssr.log`).

**Modo producción (solo lectura), en uso desde el 2026-10-24.** Para ver la reconstrucción con los datos reales, se arranca el proxy así:
`REMOTE=https://repositorio.uncp.edu.pe READ_ONLY=1 node ~/.local/dspace-dev-proxy/proxy.js &`
El backend de producción es DSpace 7.6.5.

Con `READ_ONLY=1`, solo pasan:
- `GET`, `HEAD` y `OPTIONS`;
- `POST` a `/api/authn/login`, `/api/authn/logout` y `/api/authn/shortlivedtokens`.

Todo lo demás devuelve 403 y queda en `proxy.log` como `[read-only] blocked ...`. Eso incluye `statistics/viewevents` y `searchevents`, así que no se ensucian las estadísticas. En la consola del navegador aparece un 403 por cada vista: es lo esperado.

Se puede iniciar sesión, pero guardar cualquier cambio falla a propósito. Para volver a la demo, arrancar el proxy sin esas variables. Al cambiar de backend, reiniciar también el SSR.

**Caché del navegador**: la UI sirve los estáticos con `cache-control: max-age=604800` (7 días, de `cache.control` en la config) y `dspace-theme.css` no lleva hash en el nombre, así que tras reconstruir el navegador seguía usando el CSS viejo. Por ejemplo, no se veía el arreglo del header ni el color nuevo de los botones. El proxy de desarrollo ahora fuerza `cache-control: no-cache` en todo lo que no es `/server`. Si después de un cambio de estilos algo "no aparece", hacer una recarga forzada (Ctrl+Shift+R) una vez.

### Capturas de pantalla (Chromium headless, sin sudo)
- Chromium de Playwright en `~/.cache/ms-playwright/chromium-1140`.
- Librerías que le faltaban al sistema (`libnss3`, `libnspr4`, `libasound2t64`) descargadas con `apt-get download` y extraídas con `dpkg -x` en `~/.local/chromium-libs/root` (sin instalarlas en el sistema).
- Paquete `playwright` y script en `~/.local/pwtool/shot.js`: toma captura de la parte superior y de la página completa, informa la slide activa del carrusel y lista las respuestas HTTP ≥ 400.
```bash
cd ~/.local/pwtool
LD_LIBRARY_PATH=~/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu node shot.js http://localhost:8080/ /ruta/prefijo 12000
```
- El script usa un user-agent de Chrome normal: `demo.dspace.org` responde 403 al user-agent "HeadlessChrome".
- El navegador headless está en inglés, por eso los textos que vienen de i18n aparecen en inglés ("Search", "Recent Submissions"); en un navegador en español salen en español.

- Usar `build:prod` y no `build:ssr`: sin `NODE_ENV=production` los i18n se copian sin hash y el SSR falla con `ENOENT ... en.<hash>.json`.
- Hace falta `--max-old-space-size` alto; sin eso el build se queda sin memoria.
- Si no hubo cambios de código, basta con levantar el servidor (no reconstruir).
- Verificar que `dist/server/main.js` y `dist/browser/main.*.js` tengan timestamps recientes y coherentes.
- **Detener procesos**: `for p in $(pgrep -f "[n]ode dist/server/main"); do kill $p; done` (proxy: `"[p]roxy.js"`). **No usar** `pkill -f "dist/server/main"`: el patrón coincide con la línea de comando del propio shell y lo mata (causa de los "exit code 144"). El truco del corchete solo sirve si el texto literal no aparece en otra parte del mismo comando: **matar y relanzar siempre en llamadas separadas**.

### Herramientas de comparación (en `~/.local/pwtool/`)
- `crop.js <img> <out> x y w h`: recorta una imagen a tamaño natural (sirve para comparar `recuperado/uncp-home.png` sección por sección con una captura).
- `shot.js`: acepta `W=1265` (ancho, el de `uncp-home.png`) y `LOCALE` (por defecto `es-PE`, para ver los textos en español).
- `title.js <url>`: título de la pestaña y presencia de textos, con el navegador en español.
- `extract_styles.py <dist> <selector…>`: todas las definiciones de un componente en los chunks, con el CSS y el inicio de la plantilla.
- `all_styles.py <dist> <out.json>`: CSS de todos los componentes. Corriéndolo sobre `recuperado/...` y sobre `dist/browser` se comparan selector por selector y aparecen las reglas que solo existen en producción. El último barrido no encontró personalizaciones pendientes; lo que queda son diferencias de formato y de versión de DSpace en pantallas de administración.

## 9. Extraer CSS/HTML de producción (método)

1. Buscar el chunk: `grep -l "clase-o-selector" recuperado/dspace-compilado/dspace-angular/*.js`
2. Ubicar `selectors:[["ds-nombre-componente"]]` en el chunk.
3. Buscar el siguiente `,styles:[` y extraer los strings del array (CSS literal). Reemplazar `[_nghost-%COMP%]` por `:host` y quitar `[_ngcontent-%COMP%]`.
4. Las clases globales (no de componente) están en `dspace-theme.css`; compararlas con `base-theme.css` para saber si son stock.
5. El HTML renderizado con el contenido real se saca de `recuperado/replica/*.html`.
6. Para la **lógica** (métodos TS) y las sub-plantillas, leer el tramo del chunk que va desde el `"use strict"` del módulo hasta el `defineComponent`. Las funciones de plantilla y la clase quedan legibles quitando los prefijos `ɵɵ` (así se recuperó `tipoItem()` y los badges de acceso por `dc.rights`).
7. Revisar también el i18n en **español** (`assets/i18n/es.json`), no solo en inglés: ahí estaban los textos propios de UNCP.

Referencia DSpace 7.6.0 (si hace falta comparar), se descarga a un directorio temporal:
```bash
curl -sL https://github.com/DSpace/dspace-angular/archive/refs/tags/dspace-7.6.tar.gz -o dspace-7.6.0.tar.gz
```
