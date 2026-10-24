import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RecentItemListComponent as BaseComponent } from '../../../../../app/home-page/recent-item-list/recent-item-list.component';
import { fadeIn, fadeInOut } from '../../../../../app/shared/animations/fade';

/**
 * UNCP "Publicaciones recientes" list (recovered from production).
 * The stock component is not themeable, so this one has its own selector and is used by the UNCP home page.
 */
@Component({
  selector: 'ds-uncp-recent-item-list',
  templateUrl: './recent-item-list.component.html',
  styleUrls: ['./recent-item-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fadeIn,
    fadeInOut
  ]
})
export class RecentItemListComponent extends BaseComponent {
}
