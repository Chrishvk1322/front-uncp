import { Component } from '@angular/core';
import { fadeOut } from '../../../../../../../app/shared/animations/fade';
import { AuthMethodType } from '../../../../../../../app/core/auth/models/auth.method-type';
import { renderAuthMethodFor } from '../../../../../../../app/shared/log-in/methods/log-in.methods-decorator';
import { LogInPasswordComponent as BaseComponent } from '../../../../../../../app/shared/log-in/methods/password/log-in-password.component';

/**
 * UNCP password login form: labels above the fields, rounded fields with a soft green focus, UNCP green button and
 * blue links (09/11/2026; styles `.uncp-auth-*` in _global-styles.scss). Registered for the password method after the base component (this file imports it), so it
 * replaces it on the login page and in the navbar menu.
 */
@Component({
  selector: 'ds-log-in-password',
  templateUrl: './log-in-password.component.html',
  animations: [fadeOut]
})
@renderAuthMethodFor(AuthMethodType.Password)
export class LogInPasswordComponent extends BaseComponent {
}
