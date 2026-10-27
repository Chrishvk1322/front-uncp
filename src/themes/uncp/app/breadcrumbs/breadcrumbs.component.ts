import { Component } from '@angular/core';
import { BreadcrumbsComponent as BaseComponent } from '../../../../app/breadcrumbs/breadcrumbs.component';
import { uncpDisplayName } from '../shared/uncp-communities';

/**
 * UNCP breadcrumbs: community and collection names without their order number
 * ("Inicio • 1. Arquitectura e Ingenierías" → "Inicio • Arquitectura e Ingenierías")
 */
@Component({
  selector: 'ds-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['../../../../app/breadcrumbs/breadcrumbs.component.scss']
})
export class BreadcrumbsComponent extends BaseComponent {

  /**
   * The text of a breadcrumb; only for communities and collections, so item titles are never changed
   */
  crumbText(text: string, url: string): string {
    return /^\/(communities|collections)\//.test(url ?? '') ? uncpDisplayName(text) : text;
  }
}
