import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import { fadeInOut } from '../../../../../app/shared/animations/fade';
import { UncpTotalesService } from '../../shared/uncp-totales.service';
import { UNCP_TOP_COMMUNITIES, uncpCareerStyle, uncpDisplayName, uncpFacultyCareer } from '../../shared/uncp-communities';
import { CommunityDataService } from '../../../../../app/core/data/community-data.service';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';
import { getFirstSucceededRemoteListPayload } from '../../../../../app/core/shared/operators';
import { Community } from '../../../../../app/core/shared/community.model';

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
   * The icon circle of each card in the color of its faculty (the original icon color, 14/11/2026), by UUID
   */
  facultyStyles: Record<string, Record<string, string>> = UNCP_TOP_COMMUNITIES.reduce(
    (styles, community) => ({ ...styles, [community.uuid]: uncpCareerStyle(uncpFacultyCareer(community.uuid)) }), {});

  /**
   * Documents per top-level community (by UUID) from uncp-totales.json, generated daily by the server cron.
   * Empty during SSR, until the file arrives, or when it has no valid figure for a community.
   */
  counts$: Observable<Record<string, number>> = inject(UncpTotalesService).getTotales().pipe(
    map((t) => t?.comunidadesInicio ?? {}),
    startWith({}),
  );

  private dsoNames = inject(DSONameService);

  /**
   * Names of the top-level communities (by UUID) as they are in DSpace, without the order number (13/11/2026): a
   * name changed from the DSpace administration also changes on the cards. Until they arrive, the cards show the
   * `title` of the table.
   */
  names$: Observable<Record<string, string>> = inject(CommunityDataService).findTop({ currentPage: 1, elementsPerPage: 50 }).pipe(
    getFirstSucceededRemoteListPayload(),
    map((communities: Community[]) => communities.reduce((names, c) => ({ ...names, [c.uuid]: uncpDisplayName(this.dsoNames.getName(c)) }), {})),
    startWith({}),
  );
}
