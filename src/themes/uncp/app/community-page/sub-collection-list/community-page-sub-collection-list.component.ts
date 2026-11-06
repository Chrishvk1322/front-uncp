import { Component, inject, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommunityPageSubCollectionListComponent as BaseComponent } from '../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component';
import { fadeIn } from '../../../../../app/shared/animations/fade';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { BreadcrumbsService } from '../../../../../app/breadcrumbs/breadcrumbs.service';
import { uncpCareer$, uncpCareerStyle } from '../../shared/uncp-communities';
import { UncpCollectionCard, uncpCollectionCard } from '../../shared/uncp-collection-cards';
import { UNCP_COMCOL_PAGE_SIZE } from '../sub-community-list/community-page-sub-community-list.component';

/**
 * UNCP collections of a community: a grid of cards instead of the stock list of links, all on one page. In a
 * career with an official color, the icon circles (Pregrado, Maestría, Doctorado...) take that color.
 */
@Component({
  selector: 'ds-community-page-sub-collection-list',
  styleUrls: ['../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component.scss'],
  templateUrl: './community-page-sub-collection-list.component.html',
  animations: [fadeIn]
})
export class CommunityPageSubCollectionListComponent extends BaseComponent implements OnInit {

  private dsoNameService = inject(DSONameService);

  private breadcrumbsService = inject(BreadcrumbsService);

  /**
   * Icon circles in the color of the career the collections belong to (the community of the page, or the
   * career in its breadcrumbs), or null for the neutral look
   */
  careerStyle$: Observable<Record<string, string> | null> = of(null);

  /**
   * The cards of the current page, sorted
   */
  cards$: Observable<UncpCollectionCard[]> = this.subCollectionsRDObs.pipe(
    map((rd) => (rd?.payload?.page ?? [])
      .map((collection: Collection) => uncpCollectionCard(collection.uuid, this.dsoNameService.getName(collection)))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'es'))),
  );

  ngOnInit(): void {
    this.pageSize = this.pageSize ?? UNCP_COMCOL_PAGE_SIZE;
    super.ngOnInit();
    this.careerStyle$ = uncpCareer$(this.community.uuid, this.breadcrumbsService.breadcrumbs$).pipe(map(uncpCareerStyle));
  }
}
