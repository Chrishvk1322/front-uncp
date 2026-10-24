import { Component } from '@angular/core';
import {
  SearchFormComponent as BaseComponent,
} from '../../../../../app/shared/search-form/search-form.component';

/**
 * Search box with shadow, light background and green button (recovered from production)
 */
@Component({
  selector: 'ds-search-form',
  styleUrls: ['../../../../../app/shared/search-form/search-form.component.scss'],
  templateUrl: './search-form.component.html',
})
export class SearchFormComponent extends BaseComponent {
}
