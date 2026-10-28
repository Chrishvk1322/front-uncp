import { Component, inject, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CommunityPageSubCommunityListComponent as BaseComponent } from '../../../../../app/community-page/sub-community-list/community-page-sub-community-list.component';
import { fadeIn } from '../../../../../app/shared/animations/fade';
import { BreadcrumbsService } from '../../../../../app/breadcrumbs/breadcrumbs.service';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';
import { Community } from '../../../../../app/core/shared/community.model';
import { uncpCareer, uncpCareerStyle, uncpCommunityIcon$, uncpDisplayName, UNCP_GENERIC_COMMUNITY_ICON } from '../../shared/uncp-communities';

/**
 * Subcommunities per page: all of them in practice (the most a UNCP community has is 11)
 */
export const UNCP_COMCOL_PAGE_SIZE = 50;

/**
 * UNCP subcommunities of a community: a grid of cards (the career icon on a solid circle in its official color,
 * or the faculty icon when the career has none; name without order number) instead of the stock list of links,
 * all on one page
 */
@Component({
  selector: 'ds-community-page-sub-community-list',
  styleUrls: ['../../../../../app/community-page/sub-community-list/community-page-sub-community-list.component.scss'],
  templateUrl: './community-page-sub-community-list.component.html',
  animations: [fadeIn]
})
export class CommunityPageSubCommunityListComponent extends BaseComponent implements OnInit {

  private breadcrumbsService = inject(BreadcrumbsService);

  private dsoNameService = inject(DSONameService);

  /**
   * Icon of the faculty (top-level community) these subcommunities belong to
   */
  icon$: Observable<string> = of(UNCP_GENERIC_COMMUNITY_ICON);

  /**
   * Style of the icon circle of each card, by UUID (cached: the template asks for it on every check)
   */
  private careerStyles = new Map<string, Record<string, string> | null>();

  ngOnInit(): void {
    this.pageSize = this.pageSize ?? UNCP_COMCOL_PAGE_SIZE;
    super.ngOnInit();
    this.icon$ = uncpCommunityIcon$(this.community.uuid, this.breadcrumbsService.breadcrumbs$);
  }

  /**
   * The icon circle in the official color of the career, or null for the neutral look
   */
  careerStyle(community: Community): Record<string, string> | null {
    if (!this.careerStyles.has(community.uuid)) {
      this.careerStyles.set(community.uuid, uncpCareerStyle(uncpCareer(community.uuid)));
    }
    return this.careerStyles.get(community.uuid);
  }

  /**
   * The icon of the career, or undefined to use the icon of the faculty
   */
  careerIcon(community: Community): string | undefined {
    return uncpCareer(community.uuid)?.icon;
  }

  name(community: Community): string {
    return uncpDisplayName(this.dsoNameService.getName(community));
  }
}
