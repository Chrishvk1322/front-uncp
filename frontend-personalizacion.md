# Personalizaciones del frontend para la reconstrucción

- **Repositorio:** https://repositorio.uncp.edu.pe — DSpace **7.6.5** (backend)
- **Preparado:** 23 de octubre de 2026, a partir de una revisión de solo lectura del frontend en producción
- **Objetivo:** que la reconstrucción de dspace-angular incluya todas las personalizaciones que hoy están en producción, ya como código fuente del tema y no como parches o scripts inyectados

## 1. Situación actual del frontend en producción

| Aspecto | Valor actual |
|---|---|
| Ubicación | `/var/www/dspace-angular`, servido como **build estático por nginx** (sin Node, sin SSR) |
| Fecha del build | 15 de octubre de 2025 |
| Código fuente | **No está en el servidor**; solo los archivos compilados |
| Tema activo | `dspace` (el tema personalizado se construyó sobre el tema `dspace`) |
| Bundle principal | `main.81123d5cd26b6877.js` (editado a mano el 09/06/2026, ver sección 4) |
| Copia previa al parche | `~/main_antiguo/main.81123d5cd26b6877.js` en el servidor |
| Build anterior | carpeta `OLD/` (con `main.900a1804bb1a04eb.js`), que **no** tiene el pie `modern-footer` |

Configuración en tiempo de ejecución (`assets/config.json`) que conviene conservar en el `config.yml` del nuevo build:

```yaml
ui:
  ssl: true            # en el build estático; con SSR ver sección 7
  host: repositorio.uncp.edu.pe
  port: 443
  nameSpace: /
  rateLimiter:
    windowMs: 60000
    max: 500
  useProxies: true
rest:
  ssl: true
  host: repositorio.uncp.edu.pe
  port: 443
  nameSpace: /server
browseBy:
  oneYearLimit: 10
  fiveYearLimit: 30
  defaultLowerLimit: 1900
  showThumbnails: true
  pageSize: 20
item:
  edit:
    undoTimeout: 10000
  showAccessStatuses: false
  bitstream:
    pageSize: 5
info:
  enableEndUserAgreement: true
  enablePrivacyStatement: true
markdown:
  enabled: false
  mathjax: false
```

- **Idioma por defecto:** hoy es `defaultLanguage: en`, con 23 idiomas activos. **Cambiar a `es`** (ver sección 6).
- **Caché del servidor:** la configuración actual de `cache.serverSide` es la que trae 7.6 por defecto: `botCache` con `max: 1000` y `timeToLive: 86400000`, y `anonymousCache` con `max: 0`. Solo se usa con SSR (ver sección 7).

`index.html` del build actual. Estas líneas vienen del código fuente original y deben mantenerse en `src/index.html`, salvo que el tema ya cargue estas librerías por otra vía:

```html
<title>Repositorio Institucional UNCP</title>
<script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-Fy6S3B9q64WdZWQUiU+q4/2Lc9npb8tCaSX9FK7E8HnRr0Jz8D6OP9dO5Vg3Q9ct" crossorigin="anonymous"></script>
```

Las dos líneas de scripts propios (`assets/custom/uncp-*.js`) que hoy hay al final del `<body>` **no** deben pasar al nuevo build; se reemplazan por componentes (secciones 2 y 3).

`robots.txt` en producción (modificado el 11/10/2026 para frenar a los rastreadores en las búsquedas con filtros). En 7.6 se genera desde `src/robots.txt.ejs`; el nuevo build debe producir **exactamente este contenido**:

```
User-agent: *
Disallow: /search?f.
Disallow: /search?*&f.
Allow: /

Sitemap: https://repositorio.uncp.edu.pe/sitemap.xml
```

## 2. Decisión general: componentes del tema en lugar de scripts inyectados

**Recomendación:** implementar las tres personalizaciones como componentes del tema `dspace`, dentro del código fuente.

**Por qué:**
- **Eran parches por falta de código fuente.** Los scripts inyectados y la edición del `main.js` se hicieron porque no se tenía el proyecto Angular. En una reconstrucción ya no hace falta.
- **SSR:** si el nuevo frontend usa renderizado en servidor (recomendado, sección 7), el HTML sale completo desde Node. Los scripts que retocan la página después de cargar dejan de tener sentido.
- **Robustez:** los scripts dependen de selectores CSS (`.simple-view-element`, `.stat-number`, `ds-themed-item-page-file-section`). Si cambia una plantilla, se rompen en silencio. En un componente, el compilador avisa.
- **Rendimiento:** los scripts usan un `MutationObserver` sobre todo el `body`, que se dispara con cada cambio de la página.
- **Mantenimiento:** todo queda versionado en el repositorio del frontend.

**Costo:**
- **Recompilar y desplegar:** cualquier cambio en estas personalizaciones exige recompilar y desplegar el frontend.
- **Migración:** al migrar a DSpace 8 o 9 hay que portar estos componentes junto con el resto del tema. Es lo normal en un tema propio.

**Regla para SSR:**
- **Contadores solo en el navegador.** Los datos que cambian cada día (visitas, descargas, totales del pie) se piden solo en el navegador (`isPlatformBrowser`). Si se pidieran durante el SSR:
  - cada página renderizada por Node, incluidas las de los bots, haría consultas extra al backend;
  - la caché de SSR guardaría cifras viejas.
- **Metadatos en SSR.** Lo que sale de los metadatos del ítem, como las etiquetas de tipo y acceso (sección 4), sí se renderiza en el servidor. No cuesta consultas extra y ayuda a los buscadores.

## 3. Personalización 1: visitas y descargas en la ficha de cada registro

### 3.1 Cómo funciona hoy

- **Archivo:** `assets/custom/uncp-estadisticas.js`, cargado desde `index.html` con `<script src="assets/custom/uncp-estadisticas.js?v=1" defer>`. Ver anexo A.
- **Datos:** la API pública de estadísticas, con dos consultas por ficha:
  - `/server/api/statistics/usagereports/{uuid}_TotalVisits`
  - `/server/api/statistics/usagereports/{uuid}_TotalDownloads`
- **Cálculo:** cada cifra es la **suma de `points[].values.views`** del informe. En `TotalDownloads` hay un punto por archivo, por eso se suma.
- **Páginas donde aparece:** la ficha simple y la completa: `/items/{uuid}`, `/items/{uuid}/full`, `/entities/{tipo}/{uuid}` y `/entities/{tipo}/{uuid}/full`.
- **Posición:** justo después de la sección de archivos (`ds-themed-item-page-file-section`, `ds-item-page-file-section`, `ds-themed-item-page-full-file-section` o `ds-item-page-full-file-section`).
- **Aspecto:**
  - **Bloque:** un campo más de la ficha, con el título **"Estadísticas"** y separación inferior de 15 px, igual que los demás campos.
  - **Contadores:** dos en línea, cada uno con `mr-4 text-nowrap`:
    - icono `fas fa-eye` + **Visitas:** número;
    - icono `fas fa-download` + **Descargas:** número.
  - **Formato de número:** `toLocaleString('es-PE')`.
- **Comportamiento ante fallos:**
  - si cualquiera de las dos consultas falla, **no se dibuja nada** y la ficha queda como estaba;
  - se hace **una sola consulta por registro y por carga de página**, también cuando falla;
  - si el visitante cambia de ficha mientras llega la respuesta, el bloque no se inserta en la ficha equivocada.

### 3.2 Implementación recomendada

El backend 7.6 ya expone estas estadísticas y el frontend 7.6 tiene el servicio `UsageReportDataService` (`src/app/core/statistics/usage-report-data.service.ts`). No hace falta `fetch` manual.

```ts
// src/themes/dspace/app/uncp/uncp-estadisticas/uncp-estadisticas.component.ts
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Item } from '../../../../../app/core/shared/item.model';
import { UsageReportDataService } from '../../../../../app/core/statistics/usage-report-data.service';

interface UncpEstadisticas {
  visitas: number;
  descargas: number;
}

@Component({
  selector: 'ds-uncp-estadisticas',
  templateUrl: './uncp-estadisticas.component.html',
})
export class UncpEstadisticasComponent implements OnInit {
  @Input() item: Item;

  datos$: Observable<UncpEstadisticas | null>;

  constructor(
    private usageReports: UsageReportDataService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    // Solo en el navegador: en SSR no se consulta (ver sección 2).
    if (!isPlatformBrowser(this.platformId) || !this.item) {
      return;
    }
    const total = (tipo: string): Observable<number | null> =>
      this.usageReports.getStatistic(this.item.uuid, tipo).pipe(
        map((r) => (r?.points ?? []).reduce((s, p) => s + (Number(p.values?.views) || 0), 0)),
        catchError(() => of(null)),
      );
    // Igual que hoy: si falla cualquiera de las dos, no se muestra el bloque.
    this.datos$ = combineLatest([total('TotalVisits'), total('TotalDownloads')]).pipe(
      map(([visitas, descargas]) => (visitas == null || descargas == null) ? null : { visitas, descargas }),
    );
  }
}
```

```html
<!-- src/themes/dspace/app/uncp/uncp-estadisticas/uncp-estadisticas.component.html -->
<ds-metadata-field-wrapper *ngIf="datos$ | async as d" label="Estadísticas">
  <span class="mr-4 text-nowrap">
    <i class="fas fa-eye mr-1" aria-hidden="true"></i><strong>Visitas:</strong> {{ d.visitas | number:'1.0-0':'es-PE' }}
  </span>
  <span class="text-nowrap">
    <i class="fas fa-download mr-1" aria-hidden="true"></i><strong>Descargas:</strong> {{ d.descargas | number:'1.0-0':'es-PE' }}
  </span>
</ds-metadata-field-wrapper>
```

**Dónde colocarlo:**
- **Plantillas:** en las de los tipos de ítem del tema, justo después de la sección de archivos:
  - `src/themes/dspace/app/item-page/simple/item-types/untyped-item/untyped-item.component.html`;
  - la de `publication` si se usa;
  - la ficha completa (`full-item-page`), si se quiere también ahí, como hoy.
- **Etiqueta:**
  ```html
  <ds-themed-item-page-file-section [item]="object"></ds-themed-item-page-file-section>
  <ds-uncp-estadisticas [item]="object"></ds-uncp-estadisticas>
  ```
- **Requisito:** si alguna de esas plantillas aún no está sobrescrita en el tema, hay que copiarla primero desde `src/app/...` al tema.

**Detalles:**
- **Módulo:** declarar `UncpEstadisticasComponent` en el módulo del tema (`src/themes/dspace/lazy-theme.module.ts` o `eager-theme.module.ts`, según dónde estén las plantillas que lo usan).
- **Estilo:** `ds-metadata-field-wrapper` da el mismo aspecto que los demás campos de la ficha (título y separación). Reemplaza la copia de clases y el `margin-bottom: 15px` del script actual.
- **Locale `es-PE`:** el pipe `number` con `'es-PE'` exige registrar el locale una vez:
  ```ts
  import { registerLocaleData } from '@angular/common';
  import localeEsPe from '@angular/common/locales/es-PE';
  registerLocaleData(localeEsPe);
  ```
  Si no se registra, quitar el tercer argumento del pipe y se usará el locale por defecto.
- **Iconos:** las clases `fas fa-eye` y `fas fa-download` son de Font Awesome, que DSpace 7 ya incluye.

## 4. Personalización 2: etiquetas de tipo y acceso según ALICIA 2.1.0 (parche del 09/06/2026)

### 4.1 Qué se cambió

- **Motivo:** los metadatos se actualizaron a la guía **ALICIA 2.1.0**, que usa URIs del vocabulario COAR en `dc.type` y `dc.rights`. La tarjeta de cada registro solo reconocía los valores antiguos `info:eu-repo/semantics/...` y dejó de mostrar el tipo de tesis y el estado de acceso.
- **Componente:** el cambio está en un único componente del tema, `ds-item-search-result-list-element`, la tarjeta de cada registro en búsquedas y listados. Toca dos cosas:
  1. **La función `tipoItem(valor)`,** que traduce `dc.type` a la etiqueta del distintivo (badge con icono `fa-solid fa-book`).
  2. **Las tres condiciones `ngIf`** que muestran el distintivo de acceso según `dc.rights.firstMetadataValue`:
     - **Abierto:** `alert-success bg-success-badge`, icono `fa-unlock`;
     - **Embargo:** `alert-danger`, icono `fa-lock`;
     - **Restringido:** `alert-warning`.

  El fragmento original, antes y después, está en el anexo D.

### 4.2 Equivalencias del parche y uso real (conteo del índice al 23/10/2026, 14 732 ítems)

**`dc.type`**

| Valor antiguo | Código COAR (`http://purl.org/coar/resource_type/...`) | Etiqueta | Ítems con COAR | Ítems con valor antiguo |
|---|---|---|---|---|
| `bachelorThesis` | `c_7a1f` | **Tesis de pregrado** (antes del parche decía "Tesis") | 10 524 | 3 |
| `masterThesis` | `c_bdcc` | Tesis de maestría | 3 487 | 0 |
| `doctoralThesis` | `c_db06` | Tesis doctoral | 627 | 1 |
| `book` | `c_2f33` | Libro | 66 | 0 |
| `article` | `c_6501` | Artículo | 23 | 0 |
| `patent` | — (el parche no añadió COAR) | Patente | 0 | 0 |
| `report` | — | Informe técnico | 0 | 0 |
| `workingPaper` | — | Documento de trabajo | 0 | 0 |
| `preprint` | — | Preprint | 0 | 0 |
| `postprint` | — | Postprint | 0 | 0 |
| `other` | — | Otro | 0 | 0 |
| cualquier otro valor | | **Otros** (valor por defecto) | | |

**`dc.rights`**

| Valor antiguo | Código COAR (`http://purl.org/coar/access_right/...`) | Distintivo en el parche | Ítems |
|---|---|---|---|
| `openAccess` | `c_abf2` | Abierto | 14 689 |
| `embargoedAccess` | `c_f1cf` | Embargo | 39 |
| `restrictedAccess` | `c_14cb` | Restringido | 4 |

Hoy no queda ningún ítem con `dc.rights` en formato antiguo.

### 4.3 Corrección necesaria

- **El código mal asignado:** en el vocabulario COAR de derechos de acceso, **`c_14cb` es "metadata only access"** (solo metadatos). **El acceso restringido es `c_16ec`.**
- **Efecto hoy:** el parche asigna `c_14cb` a "Restringido", así que esos 4 registros aparecen como restringidos. Además, un registro que se cargue con `c_16ec`, el código correcto según ALICIA 2.1.0, **no mostraría ningún distintivo de acceso**.
- **En la reconstrucción:**
  - **`c_16ec`:** como "Restringido".
  - **`c_14cb`:** como "Solo metadatos", con distintivo propio, o como "Restringido" si se prefiere mantener la etiqueta actual. Es una decisión de la gestión del repositorio.
- **Otros vocabularios:** también conviene dar a `patent`, `report`, `workingPaper`, `preprint` y `other` sus códigos COAR, para que futuros registros no caigan en "Otros".

### 4.4 Implementación recomendada

En `src/themes/dspace/app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component.ts`, o donde el tema tenga sobrescrito este componente, reemplazar el `switch` por mapas:

```ts
const COAR_TIPO = 'http://purl.org/coar/resource_type/';
const EU_TIPO = 'info:eu-repo/semantics/';

/** dc.type (formato antiguo y COAR, guía ALICIA 2.1.0) -> etiqueta visible. */
const TIPOS: Record<string, string> = {
  [EU_TIPO + 'bachelorThesis']: 'Tesis de pregrado',    [COAR_TIPO + 'c_7a1f']: 'Tesis de pregrado',
  [EU_TIPO + 'masterThesis']:   'Tesis de maestría',    [COAR_TIPO + 'c_bdcc']: 'Tesis de maestría',
  [EU_TIPO + 'doctoralThesis']: 'Tesis doctoral',       [COAR_TIPO + 'c_db06']: 'Tesis doctoral',
  [EU_TIPO + 'book']:           'Libro',                [COAR_TIPO + 'c_2f33']: 'Libro',
  [EU_TIPO + 'article']:        'Artículo',             [COAR_TIPO + 'c_6501']: 'Artículo',
  [EU_TIPO + 'report']:         'Informe técnico',      [COAR_TIPO + 'c_93fc']: 'Informe técnico',
  [EU_TIPO + 'patent']:         'Patente',              [COAR_TIPO + 'c_15cd']: 'Patente',
  [EU_TIPO + 'workingPaper']:   'Documento de trabajo', [COAR_TIPO + 'c_8042']: 'Documento de trabajo',
  [EU_TIPO + 'preprint']:       'Preprint',             [COAR_TIPO + 'c_816b']: 'Preprint',
  [EU_TIPO + 'postprint']:      'Postprint',
  [EU_TIPO + 'other']:          'Otro',                 [COAR_TIPO + 'c_1843']: 'Otro',
};

const COAR_ACCESO = 'http://purl.org/coar/access_right/';
const EU_ACCESO = 'info:eu-repo/semantics/';

type Acceso = 'abierto' | 'embargo' | 'restringido' | 'metadatos';

/** dc.rights (formato antiguo y COAR) -> distintivo de acceso. */
const ACCESOS: Record<string, Acceso> = {
  [EU_ACCESO + 'openAccess']:       'abierto',     [COAR_ACCESO + 'c_abf2']: 'abierto',
  [EU_ACCESO + 'embargoedAccess']:  'embargo',     [COAR_ACCESO + 'c_f1cf']: 'embargo',
  [EU_ACCESO + 'restrictedAccess']: 'restringido', [COAR_ACCESO + 'c_16ec']: 'restringido',
  [EU_ACCESO + 'closedAccess']:     'restringido',
  [COAR_ACCESO + 'c_14cb']: 'metadatos',   // "metadata only access"; usar 'restringido' si se mantiene la etiqueta actual
};
```

```ts
// dentro de la clase del componente
tipoItem(valor: string): string {
  return TIPOS[(valor || '').trim()] ?? 'Otros';
}

acceso(): Acceso | null {
  return ACCESOS[(this.dso.firstMetadataValue('dc.rights') || '').trim()] ?? null;
}
```

En la plantilla `.html` del mismo componente, las tres condiciones actuales pasan a ser:

```html
<span *ngIf="acceso() === 'abierto'"     class="alert alert-success bg-success-badge text-success fs-8 px-2 py-1 rounded-pill" role="alert">…</span>
<span *ngIf="acceso() === 'embargo'"     class="alert alert-danger bg-danger text-danger fs-8 px-2 py-1 rounded-pill" role="alert">…</span>
<span *ngIf="acceso() === 'restringido'" class="alert alert-warning fs-8 px-2 py-1 rounded-pill" role="alert">…</span>
<!-- opcional, si se separa "solo metadatos" -->
<span *ngIf="acceso() === 'metadatos'"   class="alert alert-secondary fs-8 px-2 py-1 rounded-pill" role="alert">…</span>
```

Se mantiene el contenido interno de cada `<span>` (icono y texto) que ya tiene la plantilla del tema.

**Detalles:**
- **SSR:** esta parte **sí se renderiza en el servidor**, porque usa metadatos que ya vienen con el ítem.
- **Rendimiento:** si la lista es larga, se puede calcular `acceso()` una vez en `ngOnInit` y guardarlo en una propiedad, en lugar de llamarlo desde la plantilla.
- **Revisar otros lugares:** comprobar si la ficha del ítem u otros listados (por ejemplo, las vistas en cuadrícula) también muestran `dc.type` o `dc.rights` como etiqueta. El parche solo tocó la tarjeta de resultados en lista.
- **Calidad de datos, aparte del frontend:** 17 ítems tienen `dc.type` fuera de COAR o vacío. La lista está en los archivos de inventario `inventario-pdfs-*.csv`, en la columna `dc_type`. Corregirlos en los metadatos evita depender del formato antiguo.

## 5. Personalización 3: cifras reales en el bloque "Estadísticas" del pie

### 5.1 Cómo funciona hoy

- **El pie:** el bloque `modern-footer` es del código fuente del tema. No viene del parche: está igual en el `main.js` antes y después del 09/06/2026.
- **Estructura del bloque:** `.modern-footer .stats-grid`, con elementos `.stat-item` que contienen una `.stat-label` (Documentos, Autores, Comunidades, Colecciones) y un `.stat-number` con **cifras fijas** en la plantilla.
- **El script del navegador:** `assets/custom/uncp-pie-estadisticas.js` (anexo B) lee `/assets/custom/uncp-totales.json` con `cache: 'no-cache'` y reemplaza cada `.stat-number` según su `.stat-label`:
  - la comparación es en minúsculas y sin espacios;
  - solo reemplaza si la cifra es un número positivo;
  - si el archivo falta o la cifra no es válida, **se queda el valor fijo**;
  - marca el bloque con `data-uncp-totales="1"` para no repetirlo.
- **El cálculo diario en el servidor:** `/opt/dspace/scripts/uncp_totales_pie.sh` (anexo C), en el cron del usuario `dspace` a las **05:00**. Escribe el JSON de forma atómica (archivo temporal, `chmod 644` y `mv`). Si alguna cifra no es válida, **conserva el archivo anterior**. Lo calcula así:
  - **documentos:** `totalElements` de `discover/search/objects?dsoType=item`, consultado sin sesión, es decir, lo que ve un visitante;
  - **comunidades y colecciones:** `totalElements` de `core/communities` y `core/collections`;
  - **autores:** nombres distintos en `dc.contributor.author` y `dc.creator` entre los ítems públicos, **sin asesores**. Se calcula con una faceta `unique(author_keyword)` en Solr (`archived:true AND withdrawn:false AND discoverable:true`). **Esto no se puede reproducir bien desde el navegador**, por eso se mantiene el cron.
- **Formato del JSON** (valores del 23/10/2026):
  ```json
  {"documentos": 14626, "autores": 18159, "comunidades": 54, "colecciones": 104, "actualizado": "2026-10-23T05:00:01-05:00"}
  ```

### 5.2 Implementación recomendada

El cron y el JSON se mantienen. El componente del pie del tema (`src/themes/dspace/app/footer/footer.component.ts` y `.html`, donde está `modern-footer`) lee el JSON y muestra las cifras con enlace de datos, sin script aparte:

```ts
// src/themes/dspace/app/footer/footer.component.ts (añadidos)
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

interface UncpTotales {
  documentos: number;
  autores: number;
  comunidades: number;
  colecciones: number;
  actualizado: string;
}

// Las cifras fijas actuales de la plantilla pasan a ser el valor de respaldo.
// Valores fijos del build actual (muy desactualizados; conviene subirlos a cifras recientes).
const RESPALDO: Omit<UncpTotales, 'actualizado'> = {
  documentos: 11568,
  autores: 1896,
  comunidades: 28,
  colecciones: 75,
};

const valida = (n: unknown): n is number => typeof n === 'number' && isFinite(n) && n > 0;

// en la clase del componente
totales$: Observable<Omit<UncpTotales, 'actualizado'>>;

constructor(/* ...los que ya tenga..., */ private http: HttpClient, @Inject(PLATFORM_ID) private platformId: object) {
  // ...
}

ngOnInit(): void {
  // Solo en el navegador: en SSR se renderiza el respaldo y no se cachean cifras viejas.
  this.totales$ = !isPlatformBrowser(this.platformId)
    ? of(RESPALDO)
    : this.http.get<UncpTotales>('/assets/custom/uncp-totales.json', { headers: { 'Cache-Control': 'no-cache' } }).pipe(
        map((t) => ({
          documentos: valida(t?.documentos) ? t.documentos : RESPALDO.documentos,
          autores: valida(t?.autores) ? t.autores : RESPALDO.autores,
          comunidades: valida(t?.comunidades) ? t.comunidades : RESPALDO.comunidades,
          colecciones: valida(t?.colecciones) ? t.colecciones : RESPALDO.colecciones,
        })),
        catchError(() => of(RESPALDO)),
        shareReplay(1),
      );
}
```

```html
<!-- en la plantilla del pie, dentro de .stats-grid -->
<ng-container *ngIf="totales$ | async as t">
  <div class="stat-item"><span class="stat-number stat-primary">{{ t.documentos | number:'1.0-0':'es-PE' }}</span><span class="stat-label">Documentos</span></div>
  <div class="stat-item"><span class="stat-number stat-info">{{ t.autores | number:'1.0-0':'es-PE' }}</span><span class="stat-label">Autores</span></div>
  <div class="stat-item"><span class="stat-number stat-accent">{{ t.comunidades | number:'1.0-0':'es-PE' }}</span><span class="stat-label">Comunidades</span></div>
  <div class="stat-item"><span class="stat-number stat-success">{{ t.colecciones | number:'1.0-0':'es-PE' }}</span><span class="stat-label">Colecciones</span></div>
</ng-container>
```

**Cifras fijas del build actual:** 11,568 documentos, 1896 autores, 28 comunidades y 75 colecciones. Las reales, al 23/10/2026, son 14 626, 18 159, 54 y 104. Cada cifra tiene su clase de color: `stat-primary`, `stat-info`, `stat-accent` y `stat-success`. El bloque va precedido del título "Estadísticas" con el icono `fas fa-chart-line`.

**Detalles:**
- **Estructura:** conservar las clases y el orden que ya tiene la plantilla del pie. El ejemplo solo muestra dónde va cada cifra.
- **Valores de respaldo:** `RESPALDO` debe llevar las cifras fijas que hoy tiene la plantilla, para que el comportamiento ante fallos sea igual al actual.
- **Petición relativa:** `/assets/custom/uncp-totales.json` se pide de forma relativa al sitio, así que **el archivo debe seguir sirviéndose en esa ruta** en el nuevo despliegue (ver sección 8).
- **El JSON no va en el build:** no hay que incluir `uncp-totales.json` en el código fuente, porque lo genera el cron. Si se quiere un archivo de ejemplo para desarrollo local, que no sobrescriba el de producción al desplegar.
- **`HttpClientModule`:** ya está disponible en dspace-angular.
- **Locale `es-PE`:** igual que en la sección 3.2.

### 5.3 Otros detalles del pie para revisar en la reconstrucción

Están en la plantilla actual de `modern-footer` y no tienen que ver con las cifras:
- **Redes sociales sin enlace:** Facebook, YouTube, Twitter y TikTok (`social-link`) apuntan a `href="#"`. Hay que poner las direcciones reales de la universidad o quitar los iconos.
- **Enlaces internos que probablemente no existen:** `/info/policies`, `/info/rights`, `/info/faq`, `/info/support`, `/info/terms`, `/info/accessibility` y `/info/contact`. DSpace 7.6 solo trae `/info/privacy`, `/info/end-user-agreement` y `/info/feedback`. Además, los enlaces tienen a la vez `href="#"` y `routerLink`. Conviene:
  - comprobar cuáles responden;
  - crear las páginas que falten o redirigir a las existentes;
  - quitar los `href="#"`.
- **Textos fijos** que vale la pena revisar con la gestión del repositorio:
  - "Mantente Actualizado con las Últimas Investigaciones";
  - "Trabajamos por un futuro mejor, donde investigar explora nuevas realidades.";
  - "El repositorio institucional líder en investigación académica, conectando el conocimiento con la comunidad global:";
  - la dirección "Av. Mariscal Castilla N° 3909 El Tambo - Huancayo" y el correo `repositorio@uncp.edu.pe`;
  - el distintivo "Acceso Abierto".
- **Acceso rápido y recursos:** también hay bloques con "Tesis de Grado", "Tesis de Maestría", "Tesis Doctorales", "Artículos Científicos", "Búsqueda Avanzada", "Estadísticas", "Guía de Usuario", "Manual de Autoarchivo", "Políticas del Repositorio", "Derechos de Autor", "FAQ" y "Soporte Técnico". Hay que comprobar que cada uno lleve a una página o búsqueda real.

## 6. Otros ajustes de la reconstrucción

- **Idioma por defecto en español:**
  - En `config.prod.yml`, poner `defaultLanguage: es`.
  - Revisar la lista `languages` y dejar activos solo los que se quieran ofrecer. Hoy hay 23 activos, entre ellos catalán, gaélico escocés, letón, kazajo y bengalí.
  - Si en `src/index.html` el `<html>` no tiene `lang`, conviene añadir `lang="es"`.
- **Título:** mantener `<title>Repositorio Institucional UNCP</title>`.
- **Favicons:** hoy se usan los del tema `dspace` (`assets/dspace/images/favicons/...`, definidos en `themes[].headTags`). Si la universidad tiene favicon propio, este es el momento de cambiarlo.
- **robots.txt:** reproducir el contenido de la sección 1 en `src/robots.txt.ejs`. Las reglas `Disallow: /search?f.` son parte de las medidas contra rastreadores.
- **Versión:** construir con **dspace-angular 7.6.x**, compatible con el backend 7.6.5. Otra rama mayor (8.x, 9.x) no es compatible con esta API.
- **Archivos que no deben pasar al nuevo despliegue:**
  - la carpeta `OLD/`, que hoy es públicamente accesible en `/OLD/`;
  - `frontend_15_10_25.zip`;
  - la carpeta `assets/custom/` con los scripts antiguos. Solo debe quedar `uncp-totales.json`, que genera el cron.
- **Permisos al desplegar:** hoy los archivos del frontend tienen escritura para todos los usuarios (`-rw-rw-rw-`) y pertenecen a `root`. El nuevo despliegue debe quedar con permisos `644` en archivos y `755` en carpetas, sin escritura para todos. El usuario `dspace` debe poder escribir **solo** en `assets/custom/` (para el cron del pie).

## 7. Recomendación: pasar a SSR con Node

### 7.1 Por qué

- **Google Scholar:**
  - Scholar indexa leyendo las etiquetas `citation_title`, `citation_author`, `citation_pdf_url`, etc. en el HTML. DSpace 7 las genera con Angular.
  - En modo estático el HTML llega vacío (`<ds-app></ds-app>`), y Scholar ejecuta JavaScript poco o nada.
  - Con SSR las etiquetas salen en el HTML. Es el beneficio más grande para la visibilidad de las tesis.
- **Sitemap:** hoy el índice `/sitemap.xml` lista `https://repositorio.uncp.edu.pe/sitemap0.xml`, que no entrega el sitemap porque esa ruta la debería atender el servidor Node. Con SSR, el `server.ts` de dspace-angular reenvía `/sitemap*` al backend y el problema desaparece.
- **Salud del backend:** `/server/actuator/health` deja de marcar `DOWN`. Hoy lo marca porque el indicador SEO del backend detecta que no hay SSR.
- **Vista previa de enlaces:** las vistas previas en redes sociales y los buscadores comunes reciben título, resumen y metadatos.

### 7.2 Capacidad del servidor

Análisis del 23/10/2026: la VM tiene **8 vCPU**, uso promedio diario de **1,2 a 1,8 %**, pico de 9,8 % en 7 días y CPU robada por el host del 0,01 %. Hay unos 11 GB de memoria disponibles.
- Renderizar una página cuesta entre 50 y 300 ms de CPU. Aun con decenas de miles de páginas sin caché al día, son unas pocas horas-núcleo de las 192 disponibles.
- **Se pueden usar 2 a 4 instancias de Node.** Cada una usa entre 0,5 y 1,5 GB de memoria.
- **El tipo de CPU virtual es genérico** (`QEMU Virtual CPU version 2.5+`, sin AVX ni AVX2). Funciona, pero cambiarlo en Proxmox a `host` o `x86-64-v2-AES`/`v3` mejoraría el rendimiento. Es un cambio de infraestructura aparte.

### 7.3 Riesgos y cómo mitigarlos

- **Más carga por página.** El riesgo real son los rastreadores: antes del bloqueo en nginx llegaban a 7,3 millones de peticiones diarias, sobre todo a `/search` con filtros.
  - **Mantener las reglas de nginx contra rastreadores** (`/etc/nginx/conf.d/uncp-bots.conf`, limitadas a `/search` con filtros) en la nueva configuración.
  - **Activar la caché de SSR:**
    ```yaml
    cache:
      serverSide:
        debug: false
        headers: [Link]
        botCache:            # páginas renderizadas que se sirven a bots
          max: 1000
          timeToLive: 86400000   # 1 día
          allowStale: true
        anonymousCache:      # visitantes sin sesión; 0 = desactivada
          max: 100           # valor inicial sugerido; ajustar según memoria
          timeToLive: 10000      # 10 s
          allowStale: true
    ```
  - **Limitador de peticiones:** conservar `ui.rateLimiter` (500 peticiones por minuto por IP) y `ui.useProxies: true`, para que el limitador vea la IP real detrás de nginx.
- **Un servicio más que mantener.** Node debe arrancar solo, en especial porque **el servidor se reinicia todos los días a las 00:00**. Se gestiona con un servicio `systemd` (o pm2 dentro de `systemd`), con reinicio automático.
- **Instalación en el servidor con `sudo`:** instalar Node, crear el servicio y cambiar la configuración de nginx. Lo hace el administrador del servidor.
- **Contadores:** la regla de la sección 2 evita que el SSR multiplique las consultas de estadísticas.

### 7.4 Plan de despliegue, sin corte y con vuelta atrás

1. **Compilar en otra máquina** con dspace-angular 7.6.x: tema, las tres personalizaciones de este documento y la configuración de la sección 6.
   - Node: la versión que indique la documentación de dspace-angular 7.6; 18 LTS es compatible con 7.6.
   - Compilación: `yarn install --frozen-lockfile` y luego `yarn build:prod`.
   - Resultado: la carpeta `dist/` completa, con `dist/browser` y `dist/server`.
2. **En el servidor,** copiar el build a una ruta nueva, por ejemplo `/opt/dspace-angular/`, **sin tocar `/var/www/dspace-angular`**. Configuración del modo SSR:
   ```yaml
   ui:
     ssl: false
     host: 127.0.0.1
     port: 4000
     nameSpace: /
     useProxies: true
   rest:
     ssl: true
     host: repositorio.uncp.edu.pe
     port: 443
     nameSpace: /server
   ```
   Con SSR, `ui` describe dónde escucha Node, solo en local; nginx sigue atendiendo HTTPS.
3. **Servicio `systemd` de referencia:**
   ```ini
   [Unit]
   Description=DSpace Angular (SSR)
   After=network.target tomcat9.service

   [Service]
   User=dspace
   WorkingDirectory=/opt/dspace-angular
   Environment=NODE_ENV=production
   ExecStart=/usr/bin/node dist/server/main.js
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```
   Para varias instancias, usar pm2 en modo cluster dentro del servicio, como describe la documentación de DSpace.
4. **Probar en paralelo,** con el sitio sirviendo aún el build estático, mediante `curl http://127.0.0.1:4000/...` desde el servidor:
   - la portada, una ficha de ítem (comprobar las etiquetas `citation_*` en el HTML), una búsqueda, `/sitemap0.xml` y `/robots.txt`;
   - que el bloque de estadísticas y el pie funcionen al abrir el sitio en el navegador (con un túnel SSH al puerto 4000).
5. **Cambiar nginx:**
   - los archivos estáticos (`.js`, `.css`, imágenes, fuentes, `assets/`) los sigue sirviendo nginx directamente desde `/opt/dspace-angular/dist/browser`, que es más rápido;
   - el resto se pasa a `http://127.0.0.1:4000`;
   - **`/server/` (API REST, OAI-PMH, sitemaps del backend) no cambia**;
   - las reglas contra rastreadores se mantienen;
   - el cambio se aplica con `nginx -t` y `systemctl reload nginx`, sin corte.
6. **Ajustar el cron del pie:** cambiar `DESTINO` en `/opt/dspace/scripts/uncp_totales_pie.sh` a la nueva ubicación de `assets/custom/uncp-totales.json`, por ejemplo `/opt/dspace-angular/dist/browser/assets/custom/uncp-totales.json`, y ejecutarlo una vez a mano. Otra opción es que nginx sirva `/assets/custom/` desde una ruta fija fuera del build, para que un despliegue nuevo nunca borre el JSON.
7. **Verificar en producción:**
   - `curl -s https://repositorio.uncp.edu.pe/items/<uuid> | grep citation_title` devuelve la etiqueta;
   - `curl -s https://repositorio.uncp.edu.pe/server/actuator/health` devuelve `UP`;
   - `https://repositorio.uncp.edu.pe/sitemap0.xml` entrega XML y no HTML;
   - `https://repositorio.uncp.edu.pe/server/oai/request?verb=Identify` responde 200. **La cosecha OAI-PMH de los recolectores (ALICIA, RENATI) no debe verse afectada**;
   - se ven las estadísticas en una ficha, las cifras del pie y las etiquetas de tipo y acceso en una búsqueda;
   - el idioma por defecto es español.
8. **Vuelta atrás:** devolver la configuración de nginx a la versión estática y recargar. El build anterior en `/var/www/dspace-angular` queda intacto hasta confirmar que todo funciona.

### 7.5 Si se decide seguir en modo estático

Las secciones 3 a 6 aplican igual. Además, hay que:
- **Corregir el sitemap con una regla de nginx** que entregue `/sitemapN.xml` y `/sitemapN.html` desde `/opt/dspace/sitemaps/`;
- **asumir** que Scholar seguirá indexando de forma limitada y que `health` seguirá en `DOWN`.

## 8. Cambios en el servidor al desplegar

Los aplica el administrador del servidor, cada uno con su verificación y su vuelta atrás:

1. **Retirar los scripts inyectados:** `assets/custom/uncp-estadisticas.js`, `assets/custom/uncp-pie-estadisticas.js` y sus dos líneas en `index.html`. Con el build nuevo desaparecen solos, porque no estarán en el código fuente.
2. **Ajustar `DESTINO`** en `uncp_totales_pie.sh` si cambia la ruta del frontend (sección 7.4, paso 6).
3. **Quitar `OLD/` y `frontend_15_10_25.zip`** del directorio web.
4. **Permisos:** que el nuevo despliegue no tenga escritura para todos (sección 6).
5. **Con SSR:** instalar Node, crear el servicio `systemd` y la nueva configuración de nginx (sección 7.4).
6. **Mantener intactos:** `/server/`, OAI-PMH, las reglas contra rastreadores y el resto de tareas programadas del backend.

## 9. Lista de comprobación de la reconstrucción

- [ ] dspace-angular **7.6.x**, tema `dspace` personalizado (con `modern-footer`)
- [ ] `config.prod.yml` con los valores de la sección 1 y `defaultLanguage: es`
- [ ] `src/index.html` con el título, jQuery 3.5.1 slim y Bootstrap 4.6.2 bundle (con sus `integrity`), y **sin** los scripts `assets/custom/uncp-*.js`
- [ ] `src/robots.txt.ejs` con el contenido de la sección 1
- [ ] Componente `ds-uncp-estadisticas` en la ficha simple y completa, solo en el navegador (sección 3)
- [ ] Mapas `TIPOS` y `ACCESOS` en la tarjeta de resultados, con `c_16ec` como restringido y `c_14cb` como solo metadatos (sección 4)
- [ ] Pie leyendo `/assets/custom/uncp-totales.json`, solo en el navegador, con las cifras fijas como respaldo (sección 5)
- [ ] Pie: redes sociales con enlaces reales y enlaces `/info/...` que existan (sección 5.3)
- [ ] Locale `es-PE` registrado
- [ ] Decisión tomada: SSR (recomendado) o estático (sección 7)
- [ ] Caché de SSR configurada y reglas de nginx contra rastreadores conservadas
- [ ] Verificaciones de la sección 7.4, paso 7, todas correctas, incluido OAI-PMH
- [ ] Rutas y parámetros de búsqueda iguales a los actuales (`/search?f.xxx=`), o reglas de nginx y `robots.txt` actualizadas (sección 10)
- [ ] Enlaces de filtros y facetas con `rel="nofollow"` (sección 10)
- [ ] Decisión tomada sobre Bytespider y sobre la limpieza de visitas de bots en las estadísticas (sección 10)

## 10. Rastreadores (bots): logs, consultas a la API y efecto en la reconstrucción

### 10.1 Qué pasaba

- **Volumen:** hasta el 10/10/2026, nginx recibía unos **7,3 millones de peticiones al día** para un repositorio de unos 14 500 documentos públicos. El tráfico era plano las 24 horas.
- **Origen,** según una muestra de 13,5 horas (4,09 millones de peticiones) del 11/10/2026:

  | Origen | Parte del tráfico | IP distintas |
  |---|---|---|
  | Bytespider (ByteDance) | 55,6 % | 108 |
  | Baiduspider | 17,0 % | 441 |
  | Bot con agente falso `Chrome/145.0.0.0` en Mac | 14,6 % | 16 654, en 5 305 redes |
  | Reflectionbot | 3,9 % | 70 |
  | Navegadores probablemente humanos | 5,5 % | 8 382 |
  | Internet Archive, Bing, Google y otros | 3,4 % | |

- **Mecanismo:**
  - **Qué pedían:** los cuatro primeros hacían el 96 % de las cargas de página, y entre el 83 % y el 98 % de ellas eran **`/search` con filtros encadenados** (autor, año, materia). Las combinaciones de filtros son prácticamente infinitas, así que el rastreo nunca terminaba.
  - **El efecto multiplicador:** como el frontend no tiene SSR, **cada carga de página que ejecuta JavaScript lanza unas 38 consultas a la API REST**. Eran unas 85 consultas por segundo permanentes contra el backend.
  - **robots.txt:** lo permitía todo (`Allow: /`).
- **Efecto en los logs.** Cada consulta a la API escribe líneas en el log de nginx, en el de accesos de Tomcat y en `dspace.log`. Gran parte eran avisos repetidos: peticiones sin sesión rechazadas (`Authentication is required`, 401) y la consulta de la propiedad `google.analytics.key`, que no está definida.
  - **Volumen diario:** se generaban **unos 7 GB de log al día**: 3,6 GB de nginx, 2,4 GB de `dspace.log` y 1 GB de accesos de Tomcat.
  - **Crecimiento de `dspace.log` por mes:**

    | Periodo | Tamaño de `dspace.log` |
    |---|---|
    | Octubre 2025 – julio 2026 | entre 2 y 5 GB al mes |
    | Agosto 2026 | 10,4 GB |
    | Septiembre 2026 | 22,0 GB |
    | Octubre 2026 (solo los primeros 10 días) | 23,6 GB |

  - **Logs sin purga:** se sumaba que los logs no se purgaban. `/opt/dspace/log` llegó a 89 GB y `/opt/tomcat9/logs` a 38 GB. La rotación de logs del sistema llevaba un año sin funcionar, porque coincidía con el reinicio diario de las 00:00: el `access.log` de nginx llegó a **123 GB en un solo archivo**.
  - **Consecuencia:** el disco se habría llenado en pocos meses, y con el disco lleno caen PostgreSQL, Solr y las subidas de archivos. Además, cada copia diaria de Proxmox engordaba en más de 100 GB.
- **Efecto en las estadísticas:** las visitas de los bots se registran como eventos de uso. El 10/10 hubo **188 901 eventos de estadísticas** en un día. El bot de agente falso no es reconocido como bot por DSpace, así que sus visitas **inflan las cifras de visitas y descargas** que muestra la ficha de cada registro (sección 3).

### 10.2 Qué se hizo (en el servidor, no en el frontend)

- **11 y 12/10/2026, nginx:** nginx responde **403 a `/search` con filtros** (parámetros `f.xxx=` en la dirección) para Bytespider, Baiduspider, Reflectionbot, el agente falso `Chrome/145.0.0.0` en Mac, el agente `Chrome/99.0.4844.51` que usaba Baidu para esquivar la regla y la red de Baidu.
  - La regla está en `/etc/nginx/conf.d/uncp-bots.conf` y en un bloque `location = /search` de la configuración del sitio.
  - Esos rastreadores siguen entrando a fichas, colecciones, portada y búsqueda sin filtros.
  - Google y Bing no están en la lista.
- **`robots.txt`:** excluye las búsquedas con filtros para todos los rastreadores (contenido en la sección 1).
- **API y OAI-PMH sin cambios:** el bloque `location /server/` (API REST y OAI-PMH) **no se tocó**. La cosecha de ALICIA, RENATI y los demás recolectores no se vio afectada; se verificó cada noche.
- **Logs:**
  - **Limpieza diaria:** la tarea `/opt/dspace/scripts/uncp_limpiar_logs.sh` borra los logs de más de 30 días y comprime los de más de 7.
  - **Rotación:** la rotación del sistema se movió a las 00:30, y se liberaron 115 GB.
- **Resultado medido:**

  | Día | Peticiones al backend | Eventos de estadísticas |
  |---|---|---|
  | 10/10 (sin reglas) | 6,64 M | 188 901 |
  | 11/10 (primera regla) | 1,97 M | 63 183 |
  | 14/10 | 0,81 M | 45 158 |
  | 17/10 | 0,62 M | 38 246 |
  | 20 al 22/10 | 0,80 M aprox. por día | |

  Es un **−91 % de peticiones al backend**, y el log bajó de unos 7 GB a menos de 1,5 GB al día. La CPU quedó libre en un 98 %.

### 10.3 Situación actual de los rastreadores

- **Baidu:** desde el 15/10 bajó un 96 % su tráfico y dejó de usar el agente falso.
- **Bytespider:** pasó a **270 000 – 365 000 peticiones al día** sobre fichas, listados y otras páginas sin filtros, donde casi no recibe 403. **No ejecuta JavaScript**, por eso hoy apenas genera consultas a la API: con el frontend estático solo descarga un HTML casi vacío.
- **El bot de agente falso `Chrome/145` en Mac:** sigue intentando, unas 7 400 veces al día, con unos 4 900 rechazos.
- **Los rechazos (403) son baratos:** cuestan una línea de log cada uno, en lugar de 38 consultas.

### 10.4 Qué implica para el nuevo frontend

1. **Con SSR, los bots que no ejecutan JavaScript pasan a costar consultas a la API.** Este es el punto más importante.
   - **El cambio:** hoy Bytespider recibe el `index.html` estático y no toca el backend. Con SSR, **cada página que pida la renderiza Node, y Node hace las consultas a la API en el servidor**. Sus 270 000 – 365 000 peticiones diarias se convertirían en carga real para el backend y en líneas nuevas en `dspace.log` y en el log de Tomcat.
   - **Mitigación obligatoria:**
     - **caché de SSR para bots** (`botCache`, sección 7.3): sirve las páginas ya renderizadas sin volver a consultar la API durante un día;
     - **mantener las reglas de nginx** contra rastreadores.
   - **Mitigaciones recomendadas:**
     - **límite de velocidad en nginx** para los agentes de rastreadores con nombre (`limit_req` por agente o por red), aplicado **solo** fuera de `/server/` para no afectar a OAI-PMH;
     - **decidir si se bloquea Bytespider por completo.** Recolecta contenido para entrenar modelos de ByteDance, no aporta visibilidad académica y es la mayor fuente de tráfico. Es una decisión de la gestión del repositorio. Si se bloquea, conviene también un `Disallow: /` específico para `Bytespider` en `robots.txt`, aunque no siempre lo respeta.
   - **Medir antes y después:** peticiones al backend por día en el log de accesos de Tomcat, tamaño diario de `dspace.log` y uso de CPU. Si al pasar a SSR el backend vuelve a superar con claridad el millón de peticiones al día, hay que ajustar la caché o las reglas antes de que crezcan los logs.
2. **Mantener la forma de las direcciones de búsqueda.** Las reglas de nginx y de `robots.txt` reconocen las búsquedas con filtros por la ruta `/search` y los parámetros `f.xxx=`, que son los de dspace-angular 7.6. Si el tema nuevo cambia la ruta (por ejemplo, una página de búsqueda propia), añade otra forma de filtrar o usa `/browse` con filtros, **hay que actualizar `uncp-bots.conf` y `robots.txt` antes del despliegue**. Si no, el tráfico de bots vuelve sin aviso.
3. **`rel="nofollow"` en los enlaces de filtros y facetas.** En el tema conviene poner `rel="nofollow"` en los enlaces que añaden filtros a una búsqueda (facetas de autor, año y materia, y "ver más"). Los rastreadores que respetan la etiqueta dejan de seguir combinaciones infinitas. No afecta a los visitantes ni a la indexación de las fichas, que se descubren por el sitemap.
4. **El limitador de SSR no basta contra estos bots.** `ui.rateLimiter` (500 peticiones por minuto) cuenta por IP, y el bot de agente falso usó más de 16 000 IP distintas. Sirve contra un abusador concentrado, no contra rastreadores repartidos. Por eso la protección principal siguen siendo nginx y la caché.
5. **Contadores de visitas y descargas.**
   - **Consultas:** el componente de la sección 3 hace 2 consultas a la API por ficha, solo en el navegador. Los bots que no ejecutan JavaScript no las disparan; los que sí, como el de agente falso, sí. Es una carga pequeña comparada con las 38 consultas por página de hoy, pero es una razón más para no pedir los contadores durante el SSR.
   - **Cifras infladas:** las cifras que se muestran incluyen visitas de bots que DSpace no reconoce. Si se quiere que reflejen mejor el uso real, hay una tarea del **backend**, no del frontend:
     - mantener actualizada la lista de agentes de bots de DSpace (`config/spiders/`);
     - ejecutar `dspace stats-util` para marcar o eliminar las visitas de bots ya registradas en el núcleo `statistics` de Solr.
     
     Esto cambia las cifras públicas, así que hay que decidirlo con la gestión del repositorio. Requiere un respaldo previo del núcleo `statistics` (15,2 millones de documentos al 23/10/2026). **No se ha aplicado.**
6. **Logs del nuevo servicio Node.**
   - **Que no crezcan sin control:** con SSR aparece un log más. Si Node se gestiona con `systemd`, su salida va al journal del sistema, que necesita un límite de tamaño (`SystemMaxUse` en `journald.conf`). Si se usa pm2, hay que activar su rotación de logs (`pm2-logrotate`).
   - **Que no registren cada petición:** de lo contrario se repetiría el problema de los 7 GB diarios.
   - **Tareas nocturnas lejos del reinicio:** el reinicio diario de las 00:00 corta cualquier tarea programada a esa hora. La rotación de logs del sistema ya se movió a las 00:30, y cualquier tarea nueva de limpieza o rotación debe evitar ese momento.
7. **Ruido evitable en `dspace.log`.**
   - **`google.analytics.key`:** hoy aparecen miles de avisos por esta propiedad sin definir (unos 4 300 por cada 200 000 líneas). Se corrige en el backend, definiéndola o desactivando la consulta, pero el frontend nuevo **no debería consultar Google Analytics** si no se va a usar.
   - **Peticiones anónimas a recursos protegidos:** si el tema hace peticiones a la API que exigen sesión, cada visitante genera un `401 Authentication is required` en el log. Conviene revisar en las herramientas del navegador que la portada, las fichas y las búsquedas no hagan peticiones que respondan 401 para un visitante sin sesión.

---

## Anexo A. `assets/custom/uncp-estadisticas.js` (versión en producción, como referencia del comportamiento)

```js
/*
 * UNCP - Contadores de visitas y descargas en la ficha de cada registro.
 *
 * Script independiente del build de dspace-angular: se carga desde index.html
 * y consulta la API publica de estadisticas de DSpace. Si algo falla, no
 * dibuja nada y la ficha queda como estaba.
 *
 * Para desactivarlo, quitar de index.html la linea que carga este archivo.
 */
(function () {
  'use strict';

  if (window.__uncpEstadisticas) { return; }
  window.__uncpEstadisticas = true;

  var API = '/server/api/statistics/usagereports/';
  var ID_BLOQUE = 'uncp-estadisticas';
  var RUTA_FICHA = /^\/(?:items|entities\/[^\/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/full)?\/?$/i;

  // Seccion de archivos de la ficha; el bloque se inserta justo despues.
  var ANCLAS = [
    'ds-themed-item-page-file-section',
    'ds-item-page-file-section',
    'ds-themed-item-page-full-file-section',
    'ds-item-page-full-file-section'
  ];

  var consultas = {};
  var pendiente = false;

  function uuidDeRuta() {
    var m = RUTA_FICHA.exec(window.location.pathname);
    return m ? m[1].toLowerCase() : null;
  }

  function buscarAncla() {
    for (var i = 0; i < ANCLAS.length; i++) {
      var el = document.querySelector(ANCLAS[i]);
      if (el) { return el; }
    }
    return null;
  }

  function total(uuid, informe) {
    return fetch(API + uuid + '_' + informe, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (j) {
        return (j.points || []).reduce(function (suma, p) {
          return suma + (Number(p.values && p.values.views) || 0);
        }, 0);
      });
  }

  // Una sola consulta por registro y por carga de pagina, tambien si falla.
  function datos(uuid) {
    if (!consultas[uuid]) {
      consultas[uuid] = Promise.all([total(uuid, 'TotalVisits'), total(uuid, 'TotalDownloads')])
        .then(function (v) { return { visitas: v[0], descargas: v[1] }; });
    }
    return consultas[uuid];
  }

  function formato(n) {
    try { return n.toLocaleString('es-PE'); } catch (e) { return String(n); }
  }

  function contador(icono, etiqueta, valor) {
    var span = document.createElement('span');
    span.className = 'mr-4 text-nowrap';
    var i = document.createElement('i');
    i.className = icono + ' mr-1';
    i.setAttribute('aria-hidden', 'true');
    var b = document.createElement('strong');
    b.textContent = etiqueta + ': ';
    span.appendChild(i);
    span.appendChild(b);
    span.appendChild(document.createTextNode(formato(valor)));
    return span;
  }

  // Copia vacia de un elemento de la ficha: conserva etiqueta, clases y los
  // atributos de estilo de Angular, de modo que hereda el aspecto del tema.
  function copia(modelo, selector, etiqueta, clase) {
    var origen = modelo && (selector ? modelo.querySelector(selector) : modelo);
    var el;
    if (origen) {
      el = origen.cloneNode(false);
      el.removeAttribute('id');
      el.classList.remove('d-none');
    } else {
      el = document.createElement(etiqueta);
      el.className = clase;
    }
    return el;
  }

  function crearBloque(uuid, d, ancla) {
    // Se toma como modelo el campo "Archivos"; si no hay, cualquier otro campo.
    var modelo = (ancla && ancla.querySelector('.simple-view-element')) ||
      document.querySelector('.simple-view-element');

    var div = copia(modelo, null, 'div', 'simple-view-element mb-4');
    div.id = ID_BLOQUE;
    div.setAttribute('data-uuid', uuid);
    // Misma separacion que DSpace deja entre los campos de la ficha.
    div.style.marginBottom = '15px';

    var titulo = copia(modelo, '.simple-view-element-header', 'h5', 'simple-view-element-header');
    titulo.textContent = 'Estadísticas';

    var cuerpo = copia(modelo, '.simple-view-element-body', 'div', 'simple-view-element-body');
    cuerpo.appendChild(contador('fas fa-eye', 'Visitas', d.visitas));
    cuerpo.appendChild(contador('fas fa-download', 'Descargas', d.descargas));

    div.appendChild(titulo);
    div.appendChild(cuerpo);
    return div;
  }

  function quitarBloque() {
    var bloque = document.getElementById(ID_BLOQUE);
    if (bloque) { bloque.remove(); }
  }

  function revisar() {
    pendiente = false;
    try {
      var uuid = uuidDeRuta();
      var bloque = document.getElementById(ID_BLOQUE);
      if (!uuid) { quitarBloque(); return; }
      if (bloque && bloque.getAttribute('data-uuid') === uuid) { return; }
      quitarBloque();
      if (!buscarAncla()) { return; }

      datos(uuid).then(function (d) {
        // El visitante pudo cambiar de ficha mientras llegaba la respuesta.
        if (uuidDeRuta() !== uuid || document.getElementById(ID_BLOQUE)) { return; }
        var ancla = buscarAncla();
        if (ancla) { ancla.insertAdjacentElement('afterend', crearBloque(uuid, d, ancla)); }
      }).catch(function () { /* sin estadisticas: no se dibuja nada */ });
    } catch (e) { /* nunca interrumpir la ficha */ }
  }

  function programar() {
    if (pendiente) { return; }
    pendiente = true;
    window.setTimeout(revisar, 200);
  }

  function iniciar() {
    // La aplicacion redibuja la pagina al navegar; cada cambio dispara una revision.
    new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
    programar();
  }

  if (document.body) {
    iniciar();
  } else {
    document.addEventListener('DOMContentLoaded', iniciar);
  }
})();
```

## Anexo B. `assets/custom/uncp-pie-estadisticas.js` (versión en producción, como referencia del comportamiento)

```js
/*
 * UNCP - Cifras reales en el bloque "Estadisticas" del pie de pagina.
 *
 * Script independiente del build de dspace-angular: se carga desde index.html
 * y reemplaza las cifras fijas del pie por las de assets/custom/uncp-totales.json,
 * archivo que genera cada dia /opt/dspace/scripts/uncp_totales_pie.sh.
 * Si el archivo falta o una cifra no es valida, se queda el valor fijo.
 *
 * Para desactivarlo, quitar de index.html la linea que carga este archivo.
 */
(function () {
  'use strict';

  if (window.__uncpPieEstadisticas) { return; }
  window.__uncpPieEstadisticas = true;

  var ARCHIVO = '/assets/custom/uncp-totales.json';
  var BLOQUE = '.modern-footer .stats-grid';
  var MARCA = 'data-uncp-totales';

  // Etiqueta visible en el pie -> campo del archivo de totales.
  var CAMPOS = {
    'documentos': 'documentos',
    'autores': 'autores',
    'comunidades': 'comunidades',
    'colecciones': 'colecciones'
  };

  var totales = null;
  var pendiente = false;

  function formato(n) {
    try { return n.toLocaleString('es-PE'); } catch (e) { return String(n); }
  }

  function aplicar() {
    pendiente = false;
    try {
      var bloque = document.querySelector(BLOQUE);
      if (!bloque || bloque.getAttribute(MARCA) === '1') { return; }

      var items = bloque.querySelectorAll('.stat-item');
      for (var i = 0; i < items.length; i++) {
        var etiqueta = items[i].querySelector('.stat-label');
        var numero = items[i].querySelector('.stat-number');
        if (!etiqueta || !numero) { continue; }
        var campo = CAMPOS[etiqueta.textContent.trim().toLowerCase()];
        var valor = campo ? totales[campo] : null;
        if (typeof valor === 'number' && isFinite(valor) && valor > 0) {
          numero.textContent = formato(valor);
        }
      }
      bloque.setAttribute(MARCA, '1');
    } catch (e) { /* nunca interrumpir la pagina */ }
  }

  function programar() {
    if (pendiente) { return; }
    pendiente = true;
    window.setTimeout(aplicar, 300);
  }

  function iniciar() {
    // El pie se dibuja despues de cargar la aplicacion y puede redibujarse.
    new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
    programar();
  }

  fetch(ARCHIVO, { cache: 'no-cache', headers: { Accept: 'application/json' } })
    .then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    })
    .then(function (datos) {
      if (!datos || typeof datos !== 'object') { return; }
      totales = datos;
      if (document.body) {
        iniciar();
      } else {
        document.addEventListener('DOMContentLoaded', iniciar);
      }
    })
    .catch(function () { /* sin totales: se quedan las cifras fijas */ });
})();
```

## Anexo C. `/opt/dspace/scripts/uncp_totales_pie.sh` (se mantiene en el servidor)

```bash
#!/bin/bash
#
# UNCP - Calcula los totales que muestra el bloque "Estadisticas" del pie de
# pagina y los deja en un archivo estatico que lee el navegador
# (assets/custom/uncp-pie-estadisticas.js).
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

documentos=$(total_api 'discover/search/objects?dsoType=item&size=1')
comunidades=$(total_api 'core/communities?size=1')
colecciones=$(total_api 'core/collections?size=1')
autores=$(total_autores)

for par in "documentos=$documentos" "autores=$autores" "comunidades=$comunidades" "colecciones=$colecciones"; do
  if ! [[ "${par#*=}" =~ ^[1-9][0-9]*$ ]]; then
    log "ERROR: cifra no valida (${par}); se conserva el archivo anterior"
    exit 1
  fi
done

TMP="$DESTINO.tmp.$$"
if ! printf '{"documentos": %s, "autores": %s, "comunidades": %s, "colecciones": %s, "actualizado": "%s"}\n' \
     "$documentos" "$autores" "$comunidades" "$colecciones" "$(date '+%Y-%m-%dT%H:%M:%S%:z')" > "$TMP"; then
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

log "OK documentos=$documentos autores=$autores comunidades=$comunidades colecciones=$colecciones"
```

## Anexo D. Fragmento del parche del 09/06/2026 en `main.81123d5cd26b6877.js`

Comparado con `~/main_antiguo/main.81123d5cd26b6877.js`. El código compilado está reformateado aquí para que se lea; en el archivo es una sola línea. Las diferencias empiezan en el byte 1 060 499 y se limitan al componente `ds-item-search-result-list-element`.

**Antes del parche, función `tipoItem`:**

```js
tipoItem(Y){switch(Y.trim()){
  case"info:eu-repo/semantics/book":return"Libro";
  case"info:eu-repo/semantics/article":return"Artículo";
  case"info:eu-repo/semantics/doctoralThesis":return"Tesis doctoral";
  case"info:eu-repo/semantics/masterThesis":return"Tesis de maestría";
  case"info:eu-repo/semantics/bachelorThesis":return"Tesis";
  case"info:eu-repo/semantics/patent":return"Patente";
  case"info:eu-repo/semantics/report":return"Informe técnico";
  case"info:eu-repo/semantics/workingPaper":return"Documento de trabajo";
  case"info:eu-repo/semantics/preprint":return"Preprint";
  case"info:eu-repo/semantics/postprint":return"Postprint";
  case"info:eu-repo/semantics/other":return"Otro";
  default:return"Otros"}}
```

**Después del parche:**

```js
tipoItem(Y){switch(Y.trim()){
  case"info:eu-repo/semantics/book":case"http://purl.org/coar/resource_type/c_2f33":return"Libro";
  case"info:eu-repo/semantics/article":case"http://purl.org/coar/resource_type/c_6501":return"Artículo";
  case"info:eu-repo/semantics/doctoralThesis":case"http://purl.org/coar/resource_type/c_db06":return"Tesis doctoral";
  case"info:eu-repo/semantics/masterThesis":case"http://purl.org/coar/resource_type/c_bdcc":return"Tesis de maestría";
  case"info:eu-repo/semantics/bachelorThesis":case"http://purl.org/coar/resource_type/c_7a1f":return"Tesis de pregrado";
  case"info:eu-repo/semantics/patent":return"Patente";
  case"info:eu-repo/semantics/report":return"Informe técnico";
  case"info:eu-repo/semantics/workingPaper":return"Documento de trabajo";
  case"info:eu-repo/semantics/preprint":return"Preprint";
  case"info:eu-repo/semantics/postprint":return"Postprint";
  case"info:eu-repo/semantics/other":return"Otro";
  default:return"Otros"}}
```

**Antes del parche, condiciones de acceso (`ngIf` de los tres distintivos):**

```js
"info:eu-repo/semantics/openAccess"===U.dso.firstMetadataValue("dc.rights")
"info:eu-repo/semantics/embargoedAccess"===U.dso.firstMetadataValue("dc.rights")
"info:eu-repo/semantics/restrictedAccess"===U.dso.firstMetadataValue("dc.rights")
```

**Después del parche:**

```js
"info:eu-repo/semantics/openAccess"===U.dso.firstMetadataValue("dc.rights")||"http://purl.org/coar/access_right/c_abf2" === U.dso.firstMetadataValue("dc.rights")
"info:eu-repo/semantics/embargoedAccess"===U.dso.firstMetadataValue("dc.rights")||"http://purl.org/coar/access_right/c_f1cf" === U.dso.firstMetadataValue("dc.rights")
"info:eu-repo/semantics/restrictedAccess"===U.dso.firstMetadataValue("dc.rights")||"http://purl.org/coar/access_right/c_14cb" === U.dso.firstMetadataValue("dc.rights")
```

La tercera condición usa `c_14cb` ("metadata only access"); el código COAR de acceso restringido es `c_16ec` (ver sección 4.3).

**Otros datos del componente, útiles para ubicarlo en el código fuente:**
- **Selector:** `ds-item-search-result-list-element`, que hereda del componente base de DSpace.
- **Tarjeta:** `p-md-3 p-2 border`, con `border-radius: 15px`.
- **Título:** `lead item-list-title dont-break-out text-black`.
- **Autores:** `item-list-authors text-success`.
- **Distintivo de tipo:** `badge badge-light bg-light fs-7 px-2 py-1 mr-2 text-black fw-semibold`, con icono `fa-solid fa-book pr-2`.
- **Distintivo de fecha:** icono `fa-solid fa-calendar-days`.
- **Enlace de detalle:** icono `fa-solid fa-circle-info`.
- **Iconos de acceso:** `fa-solid fa-unlock` (abierto) y `fa-solid fa-lock` (embargo).
- **Estilos propios:** `.item-list-title { font-weight: 700 !important; line-height: .75rem !important }`.
