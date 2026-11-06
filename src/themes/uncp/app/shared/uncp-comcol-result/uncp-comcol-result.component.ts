/**
 * ============================================================================================
 *  UNCP — Resultado de búsqueda que es una colección o una comunidad (tema "uncp")
 * ============================================================================================
 *
 *  En lugar del enlace con la etiqueta "Colección"/"Comunidad" de serie, una tarjeta con el mismo lenguaje de las
 *  tarjetas de subcomunidades: icono en círculo (en el color de la carrera cuando corresponde), nombre sin número
 *  de orden y, debajo, el tipo y la comunidad a la que pertenece ("Colección · Ingeniería de Sistemas").
 *  La usan collection-search-result y community-search-result (shared/object-list/search-result-list-element).
 * ============================================================================================
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ds-uncp-comcol-result',
  templateUrl: './uncp-comcol-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UncpComcolResultComponent {

  /**
   * Router link of the community or collection, or null when the result must not link anywhere
   */
  @Input() link: string[] | null;

  /**
   * The name, possibly with search hit highlights (HTML)
   */
  @Input() title: string;

  /**
   * i18n key of the type: 'collection.listelement.badge' or 'community.listelement.badge'
   */
  @Input() typeKey: string;

  /**
   * Name of the community it belongs to, if known
   */
  @Input() parentName: string | null;

  /**
   * Font Awesome icon class
   */
  @Input() icon: string;

  /**
   * Icon circle in the color of a career (uncpCareerStyle), or null for the neutral look
   */
  @Input() careerStyle: Record<string, string> | null;

  /**
   * Short description (dc.description.abstract), if any
   */
  @Input() description: string;
}
