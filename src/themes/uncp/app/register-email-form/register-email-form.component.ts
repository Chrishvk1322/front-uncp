import { Component } from '@angular/core';
import {
  RegisterEmailFormComponent as BaseComponent
} from '../../../../app/register-email-form/register-email-form.component';

/**
 * UNCP registration and password recovery form (/register and /forgot): the same card as the login page, with the
 * label above the field, the hint below it, a full-width UNCP green button and a link back to the login page
 * (09/11/2026; styles `.uncp-auth-*` in _global-styles.scss)
 */
@Component({
  selector: 'ds-register-email-form',
  templateUrl: './register-email-form.component.html',
})
export class RegisterEmailFormComponent extends BaseComponent {
}
