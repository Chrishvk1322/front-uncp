import { Component, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { BrowseByTaxonomyPageComponent as BaseComponent } from '../../../../../app/browse-by/browse-by-taxonomy-page/browse-by-taxonomy-page.component';
import { DSpaceObjectDataService } from '../../../../../app/core/data/dspace-object-data.service';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { Community } from '../../../../../app/core/shared/community.model';
import { getFirstSucceededRemoteDataPayload } from '../../../../../app/core/shared/operators';

/**
 * UNCP browse by category (hierarchical vocabulary). Opened from the "Examinar" tabs of a community or
 * collection (?scope=uuid), it shows the same UNCP header and tabs as the other browse pages, which the
 * stock page lacks.
 */
@Component({
  selector: 'ds-browse-by-taxonomy-page',
  templateUrl: './browse-by-taxonomy-page.component.html',
  styleUrls: ['../../../../../app/browse-by/browse-by-taxonomy-page/browse-by-taxonomy-page.component.scss'],
})
export class BrowseByTaxonomyPageComponent extends BaseComponent {

  private dsoService = inject(DSpaceObjectDataService);

  /**
   * The community or collection given by the scope query parameter, or null when there is none
   */
  parent$: Observable<Community | Collection | null> = this.route.queryParams.pipe(
    map((params) => params.scope),
    distinctUntilChanged(),
    switchMap((scope: string) => scope
      ? this.dsoService.findById(scope).pipe(getFirstSucceededRemoteDataPayload()) as Observable<Community | Collection>
      : of(null)),
  );
}
