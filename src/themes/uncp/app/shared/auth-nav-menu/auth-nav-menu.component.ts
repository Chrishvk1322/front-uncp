import { Component } from '@angular/core';
import {
  AuthNavMenuComponent as BaseComponent,
} from '../../../../../app/shared/auth-nav-menu/auth-nav-menu.component';
import { fadeInOut, fadeOut } from '../../../../../app/shared/animations/fade';

/**
 * Green "Iniciar sesión" button (recovered from production)
 */
@Component({
  selector: 'ds-auth-nav-menu',
  templateUrl: './auth-nav-menu.component.html',
  styleUrls: ['../../../../../app/shared/auth-nav-menu/auth-nav-menu.component.scss'],
  animations: [fadeInOut, fadeOut]
})
export class AuthNavMenuComponent extends BaseComponent {
}
