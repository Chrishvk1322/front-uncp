import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemStatisticsPageComponent as BaseComponent } from '../../../../../app/statistics-page/item-statistics-page/item-statistics-page.component';
import { DSpaceObject } from '../../../../../app/core/shared/dspace-object.model';
import { getDSORoute } from '../../../../../app/app-routing-paths';
import { uncpDisplayName } from '../../shared/uncp-communities';
import { UncpStatsView, uncpStatsView } from '../uncp-statistics';

/**
 * UNCP statistics page of an item (14/11/2026): name with the green rule, a button back to the item, cards with
 * the totals, a bar chart of the visits per month (with its table) and ranked lists. Template shared with the other
 * statistics pages of the theme; styles .uncp-stats-* in _global-styles.scss.
 */
@Component({
  selector: 'ds-item-statistics-page',
  templateUrl: '../uncp-statistics-page.component.html',
  styleUrls: ['../../../../../app/statistics-page/item-statistics-page/item-statistics-page.component.scss']
})
export class ItemStatisticsPageComponent extends BaseComponent implements OnInit {
  /** Which kind of object: picks the texts of the header and the cards */
  readonly kind: string = 'item';

  /** Cards, chart and lists */
  view$: Observable<UncpStatsView>;

  /** Whether the table of the visits per month is shown (it is always there for screen readers) */
  showTable = false;

  private translate = inject(TranslateService);

  ngOnInit(): void {
    super.ngOnInit();
    this.view$ = this.reports$.pipe(map((reports) => uncpStatsView(reports, this.translate.currentLang)));
  }

  /** The name; communities and collections without their order number ("1. Arquitectura…"), item titles as they are */
  displayName(scope: DSpaceObject): string {
    return this.kind === 'item' ? this.getName(scope) : uncpDisplayName(this.getName(scope));
  }

  /** The page of the object */
  backRoute(scope: DSpaceObject): string {
    return getDSORoute(scope);
  }
}
