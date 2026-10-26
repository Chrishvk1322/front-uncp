import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import { fadeInOut } from '../../../../../app/shared/animations/fade';
import { UncpTotalesService } from '../../shared/uncp-totales.service';

/**
 * UNCP grid of community cards (recovered from production)
 */
@Component({
  selector: 'ds-top-level-community-list',
  styleUrls: ['./top-level-community-list.component.scss'],
  templateUrl: './top-level-community-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut]
})
export class TopLevelCommunityListComponent extends BaseComponent {

  /**
   * The UNCP community cards shown on the home page. `count` is only the fallback (documents per community
   * on 2026-10-24): the real figure comes from comunidades_inicio in uncp-totales.json (see counts$).
   */
  communityCards = [
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
   * Documents per top-level community (by UUID) from uncp-totales.json, generated daily by the server cron.
   * Empty during SSR, until the file arrives, or when it has no valid figure for a community.
   */
  counts$: Observable<Record<string, number>> = inject(UncpTotalesService).getTotales().pipe(
    map((t) => t?.comunidadesInicio ?? {}),
    startWith({}),
  );
}
