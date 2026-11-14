import { Component } from '@angular/core';
import { FeedbackFormComponent as BaseComponent } from '../../../../../../app/info/feedback/feedback-form/feedback-form.component';

/**
 * UNCP feedback form ("Contacto", "Soporte Técnico" and "FAQ" of the footer), 14/11/2026: the UNCP title with the
 * green rule and the fields and button of the login form (.uncp-auth-form, .uncp-auth-submit), dimmed while
 * incomplete. With the read-only proxy the sending is blocked (403): locally only its look can be checked.
 */
@Component({
  selector: 'ds-feedback-form',
  templateUrl: './feedback-form.component.html',
  styleUrls: ['../../../../../../app/info/feedback/feedback-form/feedback-form.component.scss']
})
export class FeedbackFormComponent extends BaseComponent {
}
