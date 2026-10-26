/**
 * ============================================================================================
 *  UNCP — Tablas de mapeo de etiquetas de metadatos (tema "uncp")
 * ============================================================================================
 *
 *  Archivo propio del Repositorio Institucional UNCP; no existe en DSpace de serie.
 *  Traduce los valores URI de los metadatos a las etiquetas que se muestran en los registros
 *  de resultados (home, búsqueda y listados):
 *
 *   - dc.type   → badge con el tipo de documento ("Tesis de pregrado", "Artículo", …)
 *   - dc.rights → pastilla de acceso ("Acceso abierto", "Embargado", "Restringido")
 *
 *  Los mapeos se recuperaron del bundle compilado de producción (main.*.js) y se corrigieron
 *  según la guía ALICIA 2.1.0 / vocabularios COAR (ver frontend-personalizacion.md, sección 4.3):
 *  en producción c_14cb figuraba como restringido y faltaba c_16ec.
 *
 *  Derechos de acceso según la guía oficial ALICIA 2.1.0:
 *   - Acceso abierto ............ http://purl.org/coar/access_right/c_abf2
 *   - Acceso embargado .......... http://purl.org/coar/access_right/c_f1cf
 *   - Acceso restringido ........ http://purl.org/coar/access_right/c_16ec
 *   - Acceso solo a metadatos ... http://purl.org/coar/access_right/c_14cb
 *  Cada valor apunta a una clave i18n; los textos están en src/assets/i18n/es.json5 y en.json5
 *  (claves "uncp.item-type.*" y "uncp.access-right.*").
 *
 *  Para agregar un tipo o un derecho de acceso nuevo:
 *   1. Añadir la URI (info:eu-repo y/o COAR) en la tabla correspondiente.
 *   2. Si es una etiqueta nueva, añadir su texto en es.json5 y en.json5.
 *
 *  Usado por: src/themes/uncp/app/shared/object-list/search-result-list-element/
 *             item-search-result/item-types/item/item-search-result-list-element.component.ts
 * ============================================================================================
 */

/**
 * Clave i18n del tipo de documento para cada valor de dc.type (URI info:eu-repo o COAR).
 */
export const ITEM_TYPE_LABELS: Record<string, string> = {
  'info:eu-repo/semantics/book': 'uncp.item-type.book',
  'http://purl.org/coar/resource_type/c_2f33': 'uncp.item-type.book',
  'info:eu-repo/semantics/article': 'uncp.item-type.article',
  'http://purl.org/coar/resource_type/c_6501': 'uncp.item-type.article',
  'info:eu-repo/semantics/doctoralThesis': 'uncp.item-type.doctoral-thesis',
  'http://purl.org/coar/resource_type/c_db06': 'uncp.item-type.doctoral-thesis',
  'info:eu-repo/semantics/masterThesis': 'uncp.item-type.master-thesis',
  'http://purl.org/coar/resource_type/c_bdcc': 'uncp.item-type.master-thesis',
  'info:eu-repo/semantics/bachelorThesis': 'uncp.item-type.bachelor-thesis',
  'http://purl.org/coar/resource_type/c_7a1f': 'uncp.item-type.bachelor-thesis',
  'info:eu-repo/semantics/patent': 'uncp.item-type.patent',
  'http://purl.org/coar/resource_type/c_15cd': 'uncp.item-type.patent',
  'info:eu-repo/semantics/report': 'uncp.item-type.report',
  'http://purl.org/coar/resource_type/c_93fc': 'uncp.item-type.report',
  'info:eu-repo/semantics/workingPaper': 'uncp.item-type.working-paper',
  'http://purl.org/coar/resource_type/c_8042': 'uncp.item-type.working-paper',
  'info:eu-repo/semantics/preprint': 'uncp.item-type.preprint',
  'http://purl.org/coar/resource_type/c_816b': 'uncp.item-type.preprint',
  'info:eu-repo/semantics/postprint': 'uncp.item-type.postprint',
  'info:eu-repo/semantics/other': 'uncp.item-type.other',
  'http://purl.org/coar/resource_type/c_1843': 'uncp.item-type.other',
};

/**
 * Clave i18n usada cuando dc.type está vacío o no figura en ITEM_TYPE_LABELS.
 */
export const DEFAULT_ITEM_TYPE_LABEL = 'uncp.item-type.others';

/**
 * Cómo se muestra una pastilla de acceso.
 */
export interface AccessRightBadge {
  /** Clave i18n del texto */
  label: string;
  /** Ícono de Font Awesome */
  icon: string;
  /** Clases de color de la pastilla */
  cssClass: string;
}

const OPEN_ACCESS: AccessRightBadge = {
  label: 'uncp.access-right.open',
  icon: 'fa-unlock',
  cssClass: 'alert-success bg-success-badge text-success',
};

const EMBARGOED_ACCESS: AccessRightBadge = {
  label: 'uncp.access-right.embargoed',
  icon: 'fa-lock',
  cssClass: 'alert-danger bg-danger text-danger',
};

const RESTRICTED_ACCESS: AccessRightBadge = {
  label: 'uncp.access-right.restricted',
  icon: 'fa-lock',
  cssClass: 'alert-warning',
};

const METADATA_ONLY_ACCESS: AccessRightBadge = {
  label: 'uncp.access-right.metadata-only',
  icon: 'fa-file-lines',
  cssClass: 'alert-secondary',
};

/**
 * Pastilla de acceso para cada valor de dc.rights (URI info:eu-repo o COAR).
 * Si el valor no figura aquí, no se muestra ninguna pastilla.
 */
export const ACCESS_RIGHT_BADGES: Record<string, AccessRightBadge> = {
  'info:eu-repo/semantics/openAccess': OPEN_ACCESS,
  'http://purl.org/coar/access_right/c_abf2': OPEN_ACCESS,
  'info:eu-repo/semantics/embargoedAccess': EMBARGOED_ACCESS,
  'http://purl.org/coar/access_right/c_f1cf': EMBARGOED_ACCESS,
  'info:eu-repo/semantics/restrictedAccess': RESTRICTED_ACCESS,
  'http://purl.org/coar/access_right/c_16ec': RESTRICTED_ACCESS,
  'info:eu-repo/semantics/closedAccess': RESTRICTED_ACCESS,
  'http://purl.org/coar/access_right/c_14cb': METADATA_ONLY_ACCESS,
};

/**
 * Clave i18n del tipo de documento para un valor de dc.type.
 */
export function getItemTypeLabel(type: string): string {
  return ITEM_TYPE_LABELS[(type ?? '').trim()] ?? DEFAULT_ITEM_TYPE_LABEL;
}

/**
 * Pastilla de acceso para un valor de dc.rights, o undefined si no corresponde mostrar ninguna.
 */
export function getAccessRightBadge(rights: string): AccessRightBadge | undefined {
  return ACCESS_RIGHT_BADGES[(rights ?? '').trim()];
}
