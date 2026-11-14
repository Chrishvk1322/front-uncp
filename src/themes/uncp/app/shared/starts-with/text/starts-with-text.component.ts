import { Component } from '@angular/core';
import { renderStartsWithFor, StartsWithType } from '../../../../../../app/shared/starts-with/starts-with-decorator';
import { StartsWithTextComponent as BaseComponent } from '../../../../../../app/shared/starts-with/text/starts-with-text.component';

/** Browse indexes with their own placeholder and hint (uncp.browse.startsWith.<id>.placeholder / .hint) */
const UNCP_BROWSE_IDS = ['author', 'title', 'subject'];

/**
 * UNCP "starts with" field of the browse pages (by author, title, subject; also inside a community or collection):
 * a placeholder and hint that say what to type for the current index, e.g. "Primeras letras del autor" (14/11/2026).
 * Registered for the text type after the base component (this file imports it), so it replaces it.
 */
@Component({
  selector: 'ds-starts-with-text',
  styleUrls: ['../../../../../../app/shared/starts-with/text/starts-with-text.component.scss'],
  templateUrl: './starts-with-text.component.html'
})
@renderStartsWithFor(StartsWithType.text)
export class StartsWithTextComponent extends BaseComponent {

  /**
   * The i18n key prefix for the current browse index (route /browse/:id), or the generic one for other indexes
   */
  get uncpKeyPrefix(): string {
    let snapshot = this.route.snapshot;
    while (snapshot && !snapshot.params?.id) {
      snapshot = snapshot.parent;
    }
    const id = snapshot?.params?.id;
    return `uncp.browse.startsWith.${UNCP_BROWSE_IDS.includes(id) ? id : 'default'}`;
  }
}
