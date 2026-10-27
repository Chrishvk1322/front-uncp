import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CollectionPageComponent as BaseComponent } from '../../../../app/collection-page/collection-page.component';
import { fadeIn, fadeInOut } from '../../../../app/shared/animations/fade';

/**
 * UNCP collection page: the stock page with the UNCP header (shared/uncp-comcol-header)
 */
@Component({
  selector: 'ds-collection-page',
  templateUrl: './collection-page.component.html',
  styleUrls: ['../../../../app/collection-page/collection-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fadeIn,
    fadeInOut
  ]
})
export class CollectionPageComponent extends BaseComponent {}
