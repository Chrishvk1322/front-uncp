import { Component } from '@angular/core';
import {
  listableObjectComponent
} from '../../../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ViewMode } from '../../../../../../../../../app/core/shared/view-mode.model';
import {
  ItemSearchResult
} from '../../../../../../../../../app/shared/object-collection/shared/item-search-result.model';
import {
  ItemSearchResultListElementComponent as BaseComponent
} from '../../../../../../../../../app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { Context } from '../../../../../../../../../app/core/shared/context.model';

/**
 * UNCP search result card (recovered from production): bold title and authors, translated item type badge,
 * issue date, "Ver todos los metadatos" link and an access badge based on dc.rights
 */
@listableObjectComponent('PublicationSearchResult', ViewMode.ListElement, Context.Any, 'uncp')
@listableObjectComponent(ItemSearchResult, ViewMode.ListElement, Context.Any, 'uncp')
@Component({
  selector: 'ds-item-search-result-list-element',
  styleUrls: ['./item-search-result-list-element.component.scss'],
  templateUrl: './item-search-result-list-element.component.html',
})
export class ItemSearchResultListElementComponent extends BaseComponent {

  /**
   * Whether the item's dc.rights matches one of the given access-right URIs (info:eu-repo or COAR).
   */
  hasRights(...uris: string[]): boolean {
    return uris.includes(this.dso.firstMetadataValue('dc.rights'));
  }

  /**
   * Spanish label for a dc.type value expressed as an info:eu-repo or COAR resource type URI.
   */
  tipoItem(type: string): string {
    switch ((type ?? '').trim()) {
      case 'info:eu-repo/semantics/book':
      case 'http://purl.org/coar/resource_type/c_2f33':
        return 'Libro';
      case 'info:eu-repo/semantics/article':
      case 'http://purl.org/coar/resource_type/c_6501':
        return 'Artículo';
      case 'info:eu-repo/semantics/doctoralThesis':
      case 'http://purl.org/coar/resource_type/c_db06':
        return 'Tesis doctoral';
      case 'info:eu-repo/semantics/masterThesis':
      case 'http://purl.org/coar/resource_type/c_bdcc':
        return 'Tesis de maestría';
      case 'info:eu-repo/semantics/bachelorThesis':
      case 'http://purl.org/coar/resource_type/c_7a1f':
        return 'Tesis de pregrado';
      case 'info:eu-repo/semantics/patent':
        return 'Patente';
      case 'info:eu-repo/semantics/report':
        return 'Informe técnico';
      case 'info:eu-repo/semantics/workingPaper':
        return 'Documento de trabajo';
      case 'info:eu-repo/semantics/preprint':
        return 'Preprint';
      case 'info:eu-repo/semantics/postprint':
        return 'Postprint';
      case 'info:eu-repo/semantics/other':
        return 'Otro';
      default:
        return 'Otros';
    }
  }
}
