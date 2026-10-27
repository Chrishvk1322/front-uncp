import { Component } from '@angular/core';
import { BrowseByTitlePageComponent as BaseComponent } from '../../../../../app/browse-by/browse-by-title-page/browse-by-title-page.component';

/**
 * UNCP browse by title: the stock page with the UNCP community/collection header (shared template)
 */
@Component({
  selector: 'ds-browse-by-title-page',
  styleUrls: ['../../../../../app/browse-by/browse-by-metadata-page/browse-by-metadata-page.component.scss'],
  templateUrl: '../browse-by-metadata-page/browse-by-metadata-page.component.html'
})
export class BrowseByTitlePageComponent extends BaseComponent {
}
