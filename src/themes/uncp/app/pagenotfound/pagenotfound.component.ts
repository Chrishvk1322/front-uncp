import { Component } from '@angular/core';
import { PageNotFoundComponent as BaseComponent } from '../../../../app/pagenotfound/pagenotfound.component';

/**
 * UNCP 404 (page not found) page: minimal layout of option C, without the code label (10/11/2026; styles `.uncp-error-*`
 * in _global-styles.scss)
 */
@Component({
  selector: 'ds-pagenotfound',
  templateUrl: './pagenotfound.component.html'
})
export class PageNotFoundComponent extends BaseComponent {
}
