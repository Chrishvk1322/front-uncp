import { Component, OnInit } from '@angular/core';
import {
  listableObjectComponent
} from '../../../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ViewMode } from '../../../../../../../../../app/core/shared/view-mode.model';
import {
  ItemSearchResult
} from '../../../../../../../../../app/shared/object-collection/shared/item-search-result.model';
import {
  ItemSearchResultListElementComponent as BaseComponent
} from '../../../../../../../../../app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { Context } from '../../../../../../../../../app/core/shared/context.model';
import { AccessRightBadge, getAccessRightBadge, getItemTypeLabel } from '../../../../../uncp-metadata-labels';

/**
 * UNCP search result card (recovered from production): bold title and authors, translated item type badge,
 * issue date, "Ver todos los metadatos" link and an access badge based on dc.rights
 */
@listableObjectComponent('PublicationSearchResult', ViewMode.ListElement, Context.Any, 'uncp')
@listableObjectComponent(ItemSearchResult, ViewMode.ListElement, Context.Any, 'uncp')
@Component({
  selector: 'ds-item-search-result-list-element',
  styleUrls: ['./item-search-result-list-element.component.scss'],
  templateUrl: './item-search-result-list-element.component.html',
})
export class ItemSearchResultListElementComponent extends BaseComponent implements OnInit {

  /**
   * i18n key of the document type badge, from dc.type
   */
  itemTypeLabel: string;

  /**
   * Access badge from dc.rights, or undefined when no badge applies
   */
  accessRight: AccessRightBadge;

  ngOnInit(): void {
    super.ngOnInit();
    this.itemTypeLabel = getItemTypeLabel(this.dso.firstMetadataValue('dc.type'));
    this.accessRight = getAccessRightBadge(this.dso.firstMetadataValue('dc.rights'));
  }
}
