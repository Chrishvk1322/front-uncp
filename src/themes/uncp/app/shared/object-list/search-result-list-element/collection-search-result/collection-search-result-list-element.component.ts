import { Component, inject, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import { Context } from '../../../../../../../app/core/shared/context.model';
import { CollectionSearchResult } from '../../../../../../../app/shared/object-collection/shared/collection-search-result.model';
import {
  CollectionSearchResultListElementComponent as BaseComponent
} from '../../../../../../../app/shared/object-list/search-result-list-element/collection-search-result/collection-search-result-list-element.component';
import { LinkService } from '../../../../../../../app/core/cache/builders/link.service';
import { Community } from '../../../../../../../app/core/shared/community.model';
import { uncpCareer, uncpCareerStyle, uncpDisplayName } from '../../../uncp-communities';
import { uncpCollectionCard } from '../../../uncp-collection-cards';
import { uncpParent$ } from '../../../uncp-parent';

/**
 * UNCP search result that is a collection: a card (shared/uncp-comcol-result) with the icon of its level
 * (Pregrado, Maestría...) in the color of its career, the name without order number and its community
 */
@listableObjectComponent(CollectionSearchResult, ViewMode.ListElement, Context.Any, 'uncp')
@Component({
  selector: 'ds-collection-search-result-list-element',
  templateUrl: './collection-search-result-list-element.component.html',
})
export class CollectionSearchResultListElementComponent extends BaseComponent implements OnInit {

  private linkService = inject(LinkService);

  icon: string;

  title: string;

  parent$: Observable<Community | null> = of(null);

  careerStyle$: Observable<Record<string, string> | null> = of(null);

  ngOnInit(): void {
    super.ngOnInit();
    this.icon = uncpCollectionCard(this.dso.uuid, this.dsoNameService.getName(this.dso)).icon;
    this.title = uncpDisplayName(this.dsoTitle);
    this.parent$ = uncpParent$(this.dso, this.linkService);
    this.careerStyle$ = this.parent$.pipe(map((parent) => uncpCareerStyle(parent ? uncpCareer(parent.uuid) : null)));
  }

  parentName(parent: Community | null): string | null {
    return parent ? uncpDisplayName(this.dsoNameService.getName(parent)) : null;
  }
}
