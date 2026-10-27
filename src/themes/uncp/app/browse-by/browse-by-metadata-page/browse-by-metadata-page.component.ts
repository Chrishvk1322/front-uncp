import { Component } from '@angular/core';
import { BrowseByMetadataPageComponent as BaseComponent } from '../../../../../app/browse-by/browse-by-metadata-page/browse-by-metadata-page.component';

/**
 * UNCP browse by metadata (author, subject...): the stock page with the UNCP community/collection header
 */
@Component({
  selector: 'ds-browse-by-metadata-page',
  styleUrls: ['../../../../../app/browse-by/browse-by-metadata-page/browse-by-metadata-page.component.scss'],
  templateUrl: './browse-by-metadata-page.component.html'
})
export class BrowseByMetadataPageComponent extends BaseComponent {
}
