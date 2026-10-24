import { Component } from '@angular/core';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';

/**
 * UNCP home page: same sections as the stock one, with the UNCP recent item list and the sub-footer
 */
@Component({
  selector: 'ds-home-page',
  styleUrls: ['../../../../app/home-page/home-page.component.scss'],
  templateUrl: './home-page.component.html'
})
export class HomePageComponent extends BaseComponent {
}
