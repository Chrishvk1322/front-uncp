import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import { fadeInOut } from '../../../../../app/shared/animations/fade';
import { UncpTotalesService } from '../../shared/uncp-totales.service';
import { UNCP_TOP_COMMUNITIES } from '../../shared/uncp-communities';

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
   * The UNCP community cards shown on the home page (table in shared/uncp-communities.ts). `count` is only
   * the fallback: the real figure comes from comunidades_inicio in uncp-totales.json (see counts$).
   */
  communityCards = UNCP_TOP_COMMUNITIES;

  /**
   * Documents per top-level community (by UUID) from uncp-totales.json, generated daily by the server cron.
   * Empty during SSR, until the file arrives, or when it has no valid figure for a community.
   */
  counts$: Observable<Record<string, number>> = inject(UncpTotalesService).getTotales().pipe(
    map((t) => t?.comunidadesInicio ?? {}),
    startWith({}),
  );
}
