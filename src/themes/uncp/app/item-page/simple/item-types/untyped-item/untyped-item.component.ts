import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Item } from '../../../../../../../app/core/shared/item.model';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import {
  listableObjectComponent
} from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { Context } from '../../../../../../../app/core/shared/context.model';
import {
  UntypedItemComponent as BaseComponent
} from '../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component';

/**
 * Simple item page (items without entity type, i.e. all UNCP items): the stock 7.6.5 template plus the
 * UNCP "Estadísticas" block (ds-uncp-item-stats) after the files section
 */
@listableObjectComponent(Item, ViewMode.StandalonePage, Context.Any, 'uncp')
@Component({
  selector: 'ds-untyped-item',
  styleUrls: ['../../../../../../../app/item-page/simple/item-types/untyped-item/untyped-item.component.scss'],
  templateUrl: './untyped-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UntypedItemComponent extends BaseComponent {
}
