import { Component } from '@angular/core';
import { PageInternalServerErrorComponent as BaseComponent } from '../../../../app/page-internal-server-error/page-internal-server-error.component';

/**
 * UNCP 500 (internal server error) page: minimal layout of option C, without the code label (10/11/2026; styles `.uncp-error-*`
 * in _global-styles.scss)
 */
@Component({
  selector: 'ds-page-internal-server-error',
  templateUrl: './page-internal-server-error.component.html'
})
export class PageInternalServerErrorComponent extends BaseComponent {
}
