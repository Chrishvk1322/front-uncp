import { Component } from '@angular/core';
import { EndUserAgreementComponent as BaseComponent } from '../../../../../app/info/end-user-agreement/end-user-agreement.component';

/**
 * UNCP end user agreement (14/11/2026): the stock text in a reading column with the UNCP title, and the acceptance in
 * a box with the UNCP buttons (styles .uncp-info in _global-styles.scss)
 */
@Component({
  selector: 'ds-end-user-agreement',
  templateUrl: './end-user-agreement.component.html',
  styleUrls: ['../../../../../app/info/end-user-agreement/end-user-agreement.component.scss']
})
export class EndUserAgreementComponent extends BaseComponent {
}
