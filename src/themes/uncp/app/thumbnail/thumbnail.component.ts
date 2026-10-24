import { Component } from '@angular/core';
import { ThumbnailComponent as BaseComponent } from '../../../../app/thumbnail/thumbnail.component';

/**
 * Shows the UNCP default cover (PORTADA.png) when an item has no thumbnail (recovered from production)
 */
@Component({
  selector: 'ds-thumbnail',
  styleUrls: ['./thumbnail.component.scss'],
  templateUrl: './thumbnail.component.html',
})
export class ThumbnailComponent extends BaseComponent {
}
