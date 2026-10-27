/**
 * ============================================================================================
 *  UNCP — Comunidades de primer nivel (tema "uncp")
 * ============================================================================================
 *
 *  Las 8 comunidades de primer nivel del repositorio, con su icono y su estilo de tarjeta.
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
  cardClass: string;
  icon: string;
  title: string;
  count: number;
}

export const UNCP_TOP_COMMUNITIES: UncpTopCommunity[] = [
  { uuid: '3ab747e7-e5e3-45f3-b947-d3ae80e507d8', cardClass: 'card-arquitectura', icon: 'assets/uncp/icons/1.png', title: 'Arquitectura e Ingeniería', count: 3525 },
  { uuid: 'a24e4817-4cff-4c9c-b0bd-fcef79473277', cardClass: 'card-administrativas', icon: 'assets/uncp/icons/2.png', title: 'Ciencias Administrativas, Contables Económicas', count: 1598 },
  { uuid: 'a51150e5-83e6-4f09-bb12-8f2412f768ad', cardClass: 'card-agrarias', icon: 'assets/uncp/icons/3.png', title: 'Ciencias Agrarias', count: 1714 },
  { uuid: 'c9e7a303-9874-44b9-bf51-280646e192eb', cardClass: 'card-salud', icon: 'assets/uncp/icons/4.png', title: 'Ciencias de la Salud', count: 780 },
  { uuid: '3222eea9-3c3c-45ff-bbed-7a444937ba8d', cardClass: 'card-sociales', icon: 'assets/uncp/icons/5.png', title: 'Ciencias Sociales y Educación', count: 3370 },
  { uuid: 'f1b1550f-8be8-4f7d-bfe9-57686478ac3c', cardClass: 'card-tesis', icon: 'assets/uncp/icons/6.png', title: 'Tesis de pre y posgrado para Evaluación', count: 3559 },
  { uuid: 'b352a329-fe14-4186-b024-8e882173205a', cardClass: 'card-libros', icon: 'assets/uncp/icons/7.png', title: 'Libros de Investigación', count: 57 },
  { uuid: 'dd970c15-b58a-4c5e-b75a-d4e4e736d43c', cardClass: 'card-articulos', icon: 'assets/uncp/icons/8.png', title: 'Artículos Científicos en Revistas Indizadas', count: 23 },
];

/**
 * The top-level community with this UUID, or undefined if it is not one of them
 */
export function getTopCommunity(uuid: string): UncpTopCommunity | undefined {
  return UNCP_TOP_COMMUNITIES.find((community) => community.uuid === uuid);
}
