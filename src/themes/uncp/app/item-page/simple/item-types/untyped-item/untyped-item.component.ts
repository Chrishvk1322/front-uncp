import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Item } from '../../../../../../../app/core/shared/item.model';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import {
  listableObjectComponent
} from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { Context } from '../../../../../../../app/core/shared/context.model';
import {
  UntypedItemComponent as BaseComponent
} from '../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { AccessRightBadge, getAccessRightBadge, getItemTypeLabel } from '../../../../shared/uncp-metadata-labels';

/**
 * Simple item page (items without entity type, i.e. all UNCP items): the stock 7.6.5 template plus
 * - the UNCP "Estadísticas" block (ds-uncp-item-stats) after the files section;
 * - a wider right column (col-md-8 instead of col-md-6);
 * - the document type and access badges of the search result cards above the abstract;
 * - the abstract and citation justified, and the keywords as a bulleted list (see _global-styles.scss)
 */
@listableObjectComponent(Item, ViewMode.StandalonePage, Context.Any, 'uncp')
@Component({
  selector: 'ds-untyped-item',
  styleUrls: ['../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component.scss'],
  templateUrl: './untyped-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UntypedItemComponent extends BaseComponent implements OnInit {

  /**
   * i18n key of the document type badge, from dc.type
   */
  itemTypeLabel: string;

  /**
   * Access badge from dc.rights, or undefined when no badge applies
   */
  accessRight: AccessRightBadge;

  /**
   * The abstract(s) as paragraphs. Abstracts are usually pasted from the PDF with a hard line break
   * every line: single line breaks are joined with a space, and only blank lines separate paragraphs.
   */
  abstractParagraphs: string[] = [];

  ngOnInit(): void {
    super.ngOnInit();
    this.itemTypeLabel = getItemTypeLabel(this.object.firstMetadataValue('dc.type'));
    this.accessRight = getAccessRightBadge(this.object.firstMetadataValue('dc.rights'));
    this.abstractParagraphs = this.object.allMetadataValues('dc.description.abstract')
      .reduce((paragraphs, abstract) => paragraphs.concat(abstract.split(/\r?\n\s*\r?\n/)), [] as string[])
      .map((paragraph) => paragraph.replace(/\s*\r?\n\s*/g, ' ').trim())
      .filter((paragraph) => paragraph.length > 0);
  }
}
