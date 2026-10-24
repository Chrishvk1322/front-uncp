import { Component } from '@angular/core';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import { SearchNavbarComponent as BaseComponent } from '../../../../app/search-navbar/search-navbar.component';

/**
 * Same as the stock expandSearchInput animation, but the search box opens to 210px instead of 250px
 * so it doesn't cover the UNCP navbar links (see the #main-site-header rules in _global-styles.scss)
 */
const expandSearchInput = trigger('toggleAnimation', [
  state('collapsed', style({
    width: '0',
    opacity: '0'
  })),
  state('expanded', style({
    width: '210px',
    opacity: '1'
  })),
  transition('* => collapsed', group([
    animate('300ms ease-in-out', style({
      width: '30px'
    })),
    animate('300ms ease-in', style({
      opacity: '0'
    }))
  ])),
  transition('* => expanded', group([
    animate('300ms ease-out', style({
      opacity: '1'
    })),
    animate('300ms ease-in-out', style({
      width: '210px'
    }))
  ]))
]);

/**
 * Header search: green magnifier (recovered from production)
 */
@Component({
  selector: 'ds-search-navbar',
  styleUrls: ['../../../../app/search-navbar/search-navbar.component.scss'],
  templateUrl: './search-navbar.component.html',
  animations: [expandSearchInput]
})
export class SearchNavbarComponent extends BaseComponent {
}
