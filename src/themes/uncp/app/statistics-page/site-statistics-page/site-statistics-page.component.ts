import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SiteStatisticsPageComponent as BaseComponent } from '../../../../../app/statistics-page/site-statistics-page/site-statistics-page.component';
import { UncpStatsRow, uncpStatsRows } from '../uncp-statistics';

/**
 * UNCP site statistics page (link "Estadísticas" of the navbar, 14/11/2026). DSpace only reports the 10 most visited
 * items here, so the page is presented as that: a ranking with the position, the title linking to the item, a bar
 * relative to the first one and the number of visits. Styles .uncp-stats-* in _global-styles.scss.
 */
@Component({
  selector: 'ds-site-statistics-page',
  templateUrl: './site-statistics-page.component.html',
  styleUrls: ['../../../../../app/statistics-page/site-statistics-page/site-statistics-page.component.scss']
})
export class SiteStatisticsPageComponent extends BaseComponent implements OnInit {
  /** The most visited items, highest first */
  rows$: Observable<UncpStatsRow[]>;

  ngOnInit(): void {
    super.ngOnInit();
    this.rows$ = this.reports$.pipe(map((reports) => uncpStatsRows(reports?.[0]?.points ?? [])));
  }
}
