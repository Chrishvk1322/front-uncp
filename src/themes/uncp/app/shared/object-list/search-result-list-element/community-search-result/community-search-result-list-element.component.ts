import { Component, inject, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import { Context } from '../../../../../../../app/core/shared/context.model';
import { CommunitySearchResult } from '../../../../../../../app/shared/object-collection/shared/community-search-result.model';
import {
  CommunitySearchResultListElementComponent as BaseComponent
} from '../../../../../../../app/shared/object-list/search-result-list-element/community-search-result/community-search-result-list-element.component';
import { LinkService } from '../../../../../../../app/core/cache/builders/link.service';
import { Community } from '../../../../../../../app/core/shared/community.model';
import { getTopCommunity, uncpCareer, uncpCareerStyle, uncpDisplayName, uncpFacultyCareer, uncpInheritedCareer, UNCP_GENERIC_COMMUNITY_ICON } from '../../../uncp-communities';
import { uncpParent$ } from '../../../uncp-parent';

/**
 * UNCP search result that is a community: a card (shared/uncp-comcol-result) with the icon and color of the
 * career, or the icon of the faculty, the name without order number and the community it belongs to
 */
@listableObjectComponent(CommunitySearchResult, ViewMode.ListElement, Context.Any, 'uncp')
@Component({
  selector: 'ds-community-search-result-list-element',
  templateUrl: './community-search-result-list-element.component.html',
})
export class CommunitySearchResultListElementComponent extends BaseComponent implements OnInit {

  private linkService = inject(LinkService);

  title: string;

  parent$: Observable<Community | null> = of(null);

  /**
   * The career icon, the faculty icon (of the community itself or of its parent) or the generic one
   */
  icon$: Observable<string> = of(UNCP_GENERIC_COMMUNITY_ICON);

  /**
   * The circle in the color of the career or faculty; a career without an official color takes its faculty's
   */
  careerStyle$: Observable<Record<string, string> | null> = of(null);

  ngOnInit(): void {
    super.ngOnInit();
    this.title = uncpDisplayName(this.dsoTitle);
    const career = uncpCareer(this.dso.uuid);
    this.parent$ = uncpParent$(this.dso, this.linkService);
    const own = uncpInheritedCareer(this.dso.uuid);
    this.careerStyle$ = own ? of(uncpCareerStyle(own)) : this.parent$.pipe(
      map((parent) => uncpCareerStyle(parent ? uncpFacultyCareer(parent.uuid) : null)),
    );
    const ownIcon = career?.icon ?? getTopCommunity(this.dso.uuid)?.icon;
    this.icon$ = ownIcon ? of(ownIcon) : this.parent$.pipe(
      map((parent) => (parent && getTopCommunity(parent.uuid)?.icon) ?? UNCP_GENERIC_COMMUNITY_ICON),
    );
  }

  parentName(parent: Community | null): string | null {
    return parent ? uncpDisplayName(this.dsoNameService.getName(parent)) : null;
  }
}
