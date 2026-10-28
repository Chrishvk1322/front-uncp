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
 *   - el encabezado de las páginas de comunidad y colección (shared/uncp-comcol-header) y las tarjetas de
 *     subcomunidades (community-page/sub-community-list), que muestran el icono de la comunidad de primer
 *     nivel a la que pertenecen (uncpCommunityIcon$).
 *
 *  También está aquí uncpDisplayName(): el nombre sin el número de orden ("1. Arquitectura e Ingenierías"
 *  → "Arquitectura e Ingenierías"), que usan el encabezado, las tarjetas y las migas de pan.
 *
 *  Y las carreras profesionales (UNCP_CAREERS): su color oficial y su icono, en un círculo sólido en la tarjeta
 *  de la carrera y en el encabezado de sus páginas.
 *
 *  Si se crea, se borra o cambia de UUID una comunidad de primer nivel, hay que actualizar esta tabla.
 *  `count` es solo el respaldo de la portada (documentos por comunidad al 24/10/2026): la cifra real viene
 *  de comunidades_inicio en uncp-totales.json.
 * ============================================================================================
 */

import { Observable, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { Breadcrumb } from '../../../../app/breadcrumbs/breadcrumb/breadcrumb.model';

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

/**
 * The name without its leading order number ("1. Arquitectura e Ingenierías" → "Arquitectura e Ingenierías",
 * also "6.Tesis ..." without a space)
 */
export function uncpDisplayName(name: string): string {
  return (name ?? '').replace(/^\s*\d+\.\s*/, '');
}

/**
 * UUIDs of the communities in the breadcrumbs of the page of a community or collection (the page itself
 * included when it is a community), top-down. The breadcrumbs already resolve the whole chain of parent
 * communities (/communities/{uuid}), so this costs no extra request.
 * @param uuid         UUID of the community or collection of the current page
 * @param breadcrumbs$ BreadcrumbsService.breadcrumbs$
 */
function breadcrumbCommunities$(uuid: string, breadcrumbs$: Observable<Breadcrumb[]>): Observable<string[]> {
  return breadcrumbs$.pipe(
    // the replayed breadcrumbs of the previous page don't contain this page
    filter((crumbs) => crumbs.some((crumb) => crumb.url?.includes(uuid))),
    map((crumbs) => crumbs
      .map((crumb) => /\/communities\/([0-9a-f-]{36})/.exec(crumb.url ?? '')?.[1])
      .filter((communityUuid) => !!communityUuid)),
  );
}

/**
 * Icon of the top-level community a community or collection belongs to. A top-level community has its own;
 * for the others it comes from the breadcrumbs. Generic icon until then, or if not found.
 * @param uuid         UUID of the community or collection of the current page
 * @param breadcrumbs$ BreadcrumbsService.breadcrumbs$
 */
export function uncpCommunityIcon$(uuid: string, breadcrumbs$: Observable<Breadcrumb[]>): Observable<string> {
  const ownIcon = getTopCommunity(uuid)?.icon;
  return ownIcon ? of(ownIcon) : breadcrumbCommunities$(uuid, breadcrumbs$).pipe(
    map((uuids) => uuids.map((communityUuid) => getTopCommunity(communityUuid)?.icon).find((icon) => !!icon)
      ?? UNCP_GENERIC_COMMUNITY_ICON),
    startWith(UNCP_GENERIC_COMMUNITY_ICON),
  );
}

// ---------------------------------------------------------------------------------------------
// Carreras profesionales (subcomunidades): color oficial e icono propio
// ---------------------------------------------------------------------------------------------

/**
 * A professional career: its official color and its own icon (Font Awesome 6 solid)
 */
export interface UncpCareer {
  color: string;
  icon: string;
}

/**
 * The professional careers (subcommunities) with an official color, by UUID. Colors given by the repository
 * team (faculty 1 on 27/10/2026, faculties 2 to 5 on 28/10/2026); icons chosen with them (design A, 28/10/2026).
 * Not listed yet (color pending): the faculties 6, 7 and 8, which have no careers. Shown as a solid circle in the official
 * color with the career icon, on the career card and on the header of the career pages (and of its
 * collections). Careers not listed keep the icon of their faculty on the neutral circle.
 */
export const UNCP_CAREERS: Record<string, UncpCareer> = {
  // 1. Arquitectura e Ingenierías
  'fa5651b8-aeb5-4115-97b8-e847e58870d3': { color: '#228ACB', icon: 'fa-compass-drafting' }, // Arquitectura
  '1e21193d-b8c1-42b1-8708-1a5d67be3a08': { color: '#B51F20', icon: 'fa-bridge' }, // Ingeniería Civil
  'e90b558a-b1d1-458c-8cf9-586522781c9c': { color: '#F9C114', icon: 'fa-helmet-safety' }, // Ingeniería de Minas
  'de975efc-e33d-4dd8-90cf-eddc465ce5a1': { color: '#6496D2', icon: 'fa-laptop-code' }, // Ingeniería de Sistemas
  '139403f5-2f04-4cea-a9da-ae7f10442116': { color: '#103D66', icon: 'fa-bolt' }, // Ingeniería Eléctrica y Electrónica
  '20b4bd07-bfc2-4c12-9ed1-c7663d251542': { color: '#811E4C', icon: 'fa-gear' }, // Ingeniería Mecánica
  '5a0d1222-9c4e-40c4-929a-56a94b141c5f': { color: '#E37909', icon: 'fa-industry' }, // Ingeniería Metalúrgica y de Materiales
  '398604d9-6b46-4249-bc8a-b81a675a8c06': { color: '#FCDD18', icon: 'fa-flask' }, // Ingeniería Química
  'f7d35609-ce3f-43fa-bcc2-7d8dab729a83': { color: '#FCDD18', icon: 'fa-leaf' }, // Ingeniería Química Ambiental
  '58babcec-e9f7-4f57-9286-4cf7a9d6ce8d': { color: '#FCDD18', icon: 'fa-fire-flame-simple' }, // Ingeniería Química del Gas Natural y Energía
  '957c55db-b3aa-4ff8-85d4-822ad1d9cb93': { color: '#FCDD18', icon: 'fa-oil-well' }, // Ingeniería Química Industrial
  // 2. Ciencias Administrativas, Contables y Económicas
  'ce0eac22-4762-42f2-9a06-959ea8b38dbb': { color: '#137ABF', icon: 'fa-briefcase' }, // Ciencias de la Administración
  '4fbd8dff-4db4-45c3-b75c-140fbc0b6fcb': { color: '#083767', icon: 'fa-calculator' }, // Contabilidad
  '5b241f59-8ba7-4ef3-a0e1-cdbe44378d70': { color: '#D82120', icon: 'fa-chart-line' }, // Economía
  'df014a89-23e6-4f5f-bae1-9e0860f0b8cb': { color: '#0C71C3', icon: 'fa-handshake' }, // Administración de Negocios - Tarma
  'd0f62626-1e66-4836-b730-359c0ec2c515': { color: '#0C71C3', icon: 'fa-hotel' }, // Hotelería y Turismo - Tarma
  // 3. Ciencias Agrarias
  'e1366cc6-983f-4e82-8ce4-9f818ebedcc7': { color: '#3E9A5C', icon: 'fa-wheat-awn' }, // Agronomía
  '90dd7c39-0eab-4e6c-ae82-160120ea1a58': { color: '#00AB4B', icon: 'fa-tractor' }, // Ciencias Agrarias - Satipo
  '989ced35-7453-4b9a-8a20-9f9d991cc674': { color: '#00AB4B', icon: 'fa-seedling' }, // Ciencias Agrarias - Satipo - Agronomía Tropical
  '9679d69b-10de-49df-aa71-e8440e388166': { color: '#00AB4B', icon: 'fa-leaf' }, // Ciencias Agrarias – Satipo - Ingeniería Forestal Tropical
  'abdf0890-26bb-4111-8d72-1707c01838ac': { color: '#00AB4B', icon: 'fa-jar-wheat' }, // Ciencias Agrarias - Satipo - Ingeniería Industrias Alimentarias Tropical
  '2a3dcc7a-fcb4-4a21-94aa-d289382291cd': { color: '#00AB4B', icon: 'fa-cow' }, // Ciencias Agrarias - Satipo - Zootecnia Tropical
  '48a26deb-a8a3-41ee-be48-e0e2cce70a5d': { color: '#63B23F', icon: 'fa-tree' }, // Ciencias Forestales y del Ambiente
  'd758407c-8979-44ed-8a04-58f07a70f685': { color: '#057DC0', icon: 'fa-boxes-stacked' }, // Ingeniería Agroindustrial – Junín
  '233a40d2-1cc5-4134-a762-7a14ccdd6cf1': { color: '#0C71C3', icon: 'fa-boxes-stacked' }, // Ingeniería Agroindustrial – Tarma
  '8a664589-1987-46c8-8b8c-44540f4d8064': { color: '#F07F06', icon: 'fa-bowl-food' }, // Ingeniería en Industrias Alimentarias
  '209f8df5-2c4f-4312-b2e4-3d19cf0ac63c': { color: '#B32222', icon: 'fa-cow' }, // Zootecnia
  // 4. Ciencias de la Salud
  'ead5b3c9-2048-417f-b91d-7e0e045cb2ff': { color: '#5FC3EE', icon: 'fa-user-nurse' }, // Enfermería
  'fddc8362-3405-4253-8345-0ac336c5e655': { color: '#6F4082', icon: 'fa-staff-snake' }, // Medicina Humana
  // 5. Ciencias Sociales y Educación
  '5b007569-9f18-40ff-ae25-d704edfc56c3': { color: '#395698', icon: 'fa-people-group' }, // Antropología
  'c559dc28-b969-42a2-a8d2-a7edb7395cda': { color: '#0C71C3', icon: 'fa-microscope' }, // Ciencias Aplicadas - Tarma
  '110da6bf-a39d-4745-9329-99744f0b68a3': { color: '#194493', icon: 'fa-bullhorn' }, // Ciencias de la Comunicación
  'c9b78271-84c5-4d1b-a0fa-08867f84d278': { color: '#0199CB', icon: 'fa-chalkboard-user' }, // Educación
  '124213ef-a0c3-4df8-aa4c-b30229862a59': { color: '#08545C', icon: 'fa-dna' }, // Educación - Ciencias Biológicas
  'b97425e2-e4c6-4a96-a8fe-f81441f922f0': { color: '#921408', icon: 'fa-square-root-variable' }, // Educación - Ciencias Matemáticas e Informática
  '820a788f-b3cf-4f7d-ba70-57c30e068e8c': { color: '#08545C', icon: 'fa-earth-americas' }, // Educación - Ciencias Naturales y Ambientales
  '563a46c0-f764-4ec5-a494-a4100693d09d': { color: '#051A5F', icon: 'fa-person-running' }, // Educación - Educación Física y Psicomotricidad
  '6646c750-8995-4858-9f34-594975d26828': { color: '#DB0720', icon: 'fa-landmark' }, // Educación - Filosofía, Ciencias Sociales y Relaciones Humanas
  'a5bae83c-39c8-4314-8074-77f96c34496f': { color: '#8342BD', icon: 'fa-shapes' }, // Educación - Inicial
  'daf47cee-671d-4e95-8787-6f4661ff7aa3': { color: '#53C9E3', icon: 'fa-book-open' }, // Educación - Lenguas, Literatura y Comunicación
  '6ef9a6f7-64bf-48e6-8f6e-7cde13c78702': { color: '#55A5A6', icon: 'fa-pencil' }, // Educación - Primaria
  '35c0e875-a281-4d53-a811-a6d53822a60f': { color: '#057DC0', icon: 'fa-school' }, // Educación - Sede Junín
  'd794a83a-1ccb-4bd6-a8cc-a958b59d4ea9': { color: '#0199CB', icon: 'fa-user-graduate' }, // Educación Secundaria
  '607ac805-83a7-4a0f-81c3-868a61b1562f': { color: '#921408', icon: 'fa-atom' }, // Educación, Matemática y Física
  'f3ce763f-c4a1-4653-ae13-96c46ce6e905': { color: '#0B4392', icon: 'fa-users' }, // Sociología
  'e35434bc-3094-411c-b229-33a590b69e67': { color: '#193074', icon: 'fa-hands-holding-child' }, // Trabajo Social
};

/**
 * Charcoal of the university seal, for the icon on light career colors (the yellows)
 */
const CHARCOAL = '#272625';

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
}

/**
 * WCAG relative luminance
 */
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio of two colors
 */
export function uncpContrast(a: string, b: string): number {
  const [l1, l2] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Color of the icon on a circle of this color: white when it has the 3:1 contrast that icons need, otherwise
 * the charcoal of the seal
 */
export function uncpIconColorOn(color: string): string {
  return uncpContrast('#ffffff', color) >= 3 ? '#ffffff' : CHARCOAL;
}

/**
 * The career with this UUID, or undefined if it has no official color
 */
export function uncpCareer(uuid: string): UncpCareer | undefined {
  return UNCP_CAREERS[uuid];
}

/**
 * The career a community or collection belongs to (the career itself, or the career in its breadcrumbs), or
 * null when it doesn't belong to one with an official color
 * @param uuid         UUID of the community or collection of the current page
 * @param breadcrumbs$ BreadcrumbsService.breadcrumbs$
 */
export function uncpCareer$(uuid: string, breadcrumbs$: Observable<Breadcrumb[]>): Observable<UncpCareer | null> {
  const own = uncpCareer(uuid);
  return own ? of(own) : breadcrumbCommunities$(uuid, breadcrumbs$).pipe(
    map((uuids) => uuids.map((communityUuid) => uncpCareer(communityUuid)).find((career) => !!career) ?? null),
    startWith(null),
  );
}

/**
 * Style of an icon circle in the color of a career: CSS variables read by .uncp-community-icon.uncp-career-icon
 * (global styles)
 */
export function uncpCareerStyle(career: UncpCareer | null | undefined): Record<string, string> | null {
  return career ? { '--uncp-career-bg': career.color, '--uncp-career-fg': uncpIconColorOn(career.color) } : null;
}
