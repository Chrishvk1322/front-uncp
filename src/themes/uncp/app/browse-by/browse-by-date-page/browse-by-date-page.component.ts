import { Component } from '@angular/core';
import { BrowseByDatePageComponent as BaseComponent } from '../../../../../app/browse-by/browse-by-date-page/browse-by-date-page.component';

/**
 * UNCP browse by date: the stock page with the UNCP community/collection header (shared template)
 */
@Component({
  selector: 'ds-browse-by-date-page',
  styleUrls: ['../../../../../app/browse-by/browse-by-metadata-page/browse-by-metadata-page.component.scss'],
  templateUrl: '../browse-by-metadata-page/browse-by-metadata-page.component.html'
})
export class BrowseByDatePageComponent extends BaseComponent {
}
