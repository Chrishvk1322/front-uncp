import { Component } from '@angular/core';
import { ForbiddenComponent as BaseComponent } from '../../../../app/forbidden/forbidden.component';

/**
 * UNCP 403 (forbidden) page: minimal layout of option C, without the code label (10/11/2026; styles `.uncp-error-*`
 * in _global-styles.scss)
 */
@Component({
  selector: 'ds-forbidden',
  templateUrl: './forbidden.component.html'
})
export class ForbiddenComponent extends BaseComponent {
}
