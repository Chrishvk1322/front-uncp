import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeInOut } from '../../../../../app/shared/animations/fade';
import { FullItemPageComponent as BaseComponent } from '../../../../../app/item-page/full/full-item-page.component';

/**
 * Full item page: the stock 7.6.5 template plus the UNCP "Estadísticas" block (ds-uncp-item-stats)
 * after the files section
 */
@Component({
  selector: 'ds-full-item-page',
  styleUrls: ['../../../../../app/item-page/full/full-item-page.component.scss'],
  templateUrl: './full-item-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut]
})
export class FullItemPageComponent extends BaseComponent {
}
