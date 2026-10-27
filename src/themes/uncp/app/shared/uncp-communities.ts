/**
 * ============================================================================================
 *  UNCP — Comunidades de primer nivel (tema "uncp")
 * ============================================================================================
 *
 *  Las 8 comunidades de primer nivel del repositorio, con su icono.
 *  Iconos (27/10/2026): Font Awesome 6 (`fa-solid`), en verde UNCP sobre un círculo verde claro (clase global
 *  `.uncp-community-icon`). Reemplazan a los PNG de colores de producción (assets/icons/1-8.png), que no
 *  seguían la paleta institucional y tenían metáforas poco claras (un átomo para Ciencias Agrarias).
 *  Las usan:
 *   - las tarjetas de la portada (home-page/top-level-community-list);
 *   - el encabezado de las páginas de comunidad y colección (shared/uncp-comcol-header), que muestra
 *     el icono de la comunidad de primer nivel a la que pertenece la página.
 *
 *  Si se crea, se borra o cambia de UUID una comunidad de primer nivel, hay que actualizar esta tabla.
 *  `count` es solo el respaldo de la portada (documentos por comunidad al 24/10/2026): la cifra real viene
 *  de comunidades_inicio en uncp-totales.json.
 * ============================================================================================
 */

/**
 * A top-level community of the UNCP repository
 */
export interface UncpTopCommunity {
  uuid: string;
  /** Font Awesome 6 solid icon class, e.g. 'fa-seedling' */
  icon: string;
  title: string;
  count: number;
}

export const UNCP_TOP_COMMUNITIES: UncpTopCommunity[] = [
  { uuid: '3ab747e7-e5e3-45f3-b947-d3ae80e507d8', icon: 'fa-gears', title: 'Arquitectura e Ingeniería', count: 3525 },
  { uuid: 'a24e4817-4cff-4c9c-b0bd-fcef79473277', icon: 'fa-chart-column', title: 'Ciencias Administrativas, Contables Económicas', count: 1598 },
  { uuid: 'a51150e5-83e6-4f09-bb12-8f2412f768ad', icon: 'fa-seedling', title: 'Ciencias Agrarias', count: 1714 },
  { uuid: 'c9e7a303-9874-44b9-bf51-280646e192eb', icon: 'fa-stethoscope', title: 'Ciencias de la Salud', count: 780 },
  { uuid: '3222eea9-3c3c-45ff-bbed-7a444937ba8d', icon: 'fa-chalkboard-user', title: 'Ciencias Sociales y Educación', count: 3370 },
  { uuid: 'f1b1550f-8be8-4f7d-bfe9-57686478ac3c', icon: 'fa-graduation-cap', title: 'Tesis de pre y posgrado para Evaluación', count: 3559 },
  { uuid: 'b352a329-fe14-4186-b024-8e882173205a', icon: 'fa-book', title: 'Libros de Investigación', count: 57 },
  { uuid: 'dd970c15-b58a-4c5e-b75a-d4e4e736d43c', icon: 'fa-newspaper', title: 'Artículos Científicos en Revistas Indizadas', count: 23 },
];

/**
 * Icon for the pages whose top-level community can't be determined
 */
export const UNCP_GENERIC_COMMUNITY_ICON = 'fa-folder-open';

/**
 * The top-level community with this UUID, or undefined if it is not one of them
 */
export function getTopCommunity(uuid: string): UncpTopCommunity | undefined {
  return UNCP_TOP_COMMUNITIES.find((community) => community.uuid === uuid);
}
