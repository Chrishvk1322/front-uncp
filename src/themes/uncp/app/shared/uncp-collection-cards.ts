/**
 * ============================================================================================
 *  UNCP — Tarjeta de una colección: nivel de tesis, icono y orden (tema "uncp")
 * ============================================================================================
 *
 *  Las colecciones de tesis ("Tesis - Pregrado - Ingeniería de Sistemas", "Tesis Doctorado - ...",
 *  "Maestría-...", también "Maestria" sin tilde) se reconocen por su nivel, con su icono y su orden
 *  (Pregrado → Segunda Especialidad → Maestría → Doctorado); las demás, por palabras clave.
 *  Lo usan las tarjetas de colecciones de una comunidad (community-page/sub-collection-list) y los
 *  resultados de búsqueda que son colecciones (shared/object-list/.../collection-search-result).
 * ============================================================================================
 */
import { uncpDisplayName } from './uncp-communities';

/**
 * A collection as shown on its card
 */
export interface UncpCollectionCard {
  uuid: string;
  /** "Pregrado", "Maestría"... for thesis collections, otherwise the name */
  title: string;
  /** The full name, when the title is only the level */
  subtitle?: string;
  icon: string;
  order: number;
}

/**
 * Thesis levels, in the order the cards are shown, with their icon
 */
const LEVELS = [
  { pattern: /pregrado/i, label: 'Pregrado', icon: 'fa-graduation-cap' },
  { pattern: /segunda especialidad/i, label: 'Segunda Especialidad', icon: 'fa-certificate' },
  { pattern: /maestr[ií]a/i, label: 'Maestría', icon: 'fa-scroll' },
  { pattern: /doctorado/i, label: 'Doctorado', icon: 'fa-award' },
];

/**
 * Names that are only "[Tesis] <level> - <program>" ("Tesis - Pregrado - Ingeniería de Sistemas",
 * "Tesis Doctorado - ...", "Maestría-Ingeniería Química Ambiental")
 */
const LEVEL_NAME = /^(tesis\s*-?\s*)?(pregrado|segunda especialidad|maestr[ií]a|doctorado)\s*-\s*\S/i;

/**
 * Icon of the collections that are not of a thesis level
 */
const OTHER_ICONS = [
  { pattern: /libro/i, icon: 'fa-book' },
  { pattern: /art[ií]culo/i, icon: 'fa-newspaper' },
  { pattern: /embargo/i, icon: 'fa-lock' },
  { pattern: /tesis/i, icon: 'fa-graduation-cap' },
];

/**
 * The card of a collection: thesis collections show their level as title (in the community of the program
 * the rest of the name is redundant) and are sorted Pregrado → Segunda Especialidad → Maestría → Doctorado;
 * the others keep their name (without order number) and go after them, alphabetically
 */
export function uncpCollectionCard(uuid: string, name: string): UncpCollectionCard {
  const fullName = uncpDisplayName(name);
  const levelIndex = LEVELS.findIndex((level) => level.pattern.test(fullName));
  const level = LEVELS[levelIndex];
  if (level && LEVEL_NAME.test(fullName)) {
    return { uuid, title: level.label, subtitle: fullName, icon: level.icon, order: levelIndex };
  }
  return {
    uuid,
    title: fullName,
    icon: level?.icon ?? OTHER_ICONS.find((other) => other.pattern.test(fullName))?.icon ?? 'fa-folder-open',
    order: LEVELS.length,
  };
}
