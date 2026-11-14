import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ComcolPageBrowseByComponent as BaseComponent } from '../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component';

/** Value of the "Ver estadísticas" option in the phone select (not a browse id) */
export const UNCP_STATISTICS_OPTION = 'uncp-statistics';

/**
 * UNCP "Examinar" bar of communities, subcommunities and collections: the stock options plus a last one, "Ver
 * estadísticas", to the statistics page of the community or collection (14/11/2026, asked by the user)
 */
@Component({
  selector: 'ds-comcol-page-browse-by',
  styleUrls: ['../../../../../app/shared/comcol/comcol-page-browse-by/comcol-page-browse-by.component.scss'],
  templateUrl: './comcol-page-browse-by.component.html'
})
export class ComcolPageBrowseByComponent extends BaseComponent {
  readonly statisticsOption = UNCP_STATISTICS_OPTION;

  private uncpRouter = inject(Router);

  /** /statistics/communities/:id or /statistics/collections/:id */
  get statisticsRoute(): string {
    return `/statistics/${this.contentType === 'collection' ? 'collections' : 'communities'}/${this.id}`;
  }

  onSelectChange(newId: string) {
    if (newId === UNCP_STATISTICS_OPTION) {
      this.uncpRouter.navigate([this.statisticsRoute]);
    } else {
      super.onSelectChange(newId);
    }
  }
}
