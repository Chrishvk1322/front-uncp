import { Component } from '@angular/core';
import { PrivacyComponent as BaseComponent } from '../../../../../app/info/privacy/privacy.component';

/**
 * UNCP privacy statement (14/11/2026): the stock text in a reading column, with the title and the short green rule of
 * the other UNCP pages (styles .uncp-info in _global-styles.scss)
 */
@Component({
  selector: 'ds-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['../../../../../app/info/privacy/privacy.component.scss']
})
export class PrivacyComponent extends BaseComponent {
}
