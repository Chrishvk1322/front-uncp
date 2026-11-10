import { Component } from '@angular/core';
import { LoginPageComponent as BaseComponent } from '../../../../app/login-page/login-page.component';

/**
 * UNCP login page: the form in a white card with the UNCP logo, title and subtitle (option A, 09/11/2026; styles
 * `.uncp-auth-*` in _global-styles.scss)
 */
@Component({
  selector: 'ds-login-page',
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent extends BaseComponent {
}
