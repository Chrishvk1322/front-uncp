import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Breadcrumb } from '../breadcrumbs/breadcrumb/breadcrumb.model';
import { BreadcrumbsProviderService } from '../core/breadcrumbs/breadcrumbsProviderService';
import { DSOBreadcrumbsService } from '../core/breadcrumbs/dso-breadcrumbs.service';
import { ChildHALResource } from '../core/shared/child-hal-resource.model';
import { DSpaceObject } from '../core/shared/dspace-object.model';
import { getDSORoute } from '../app-routing-paths';

/**
 * Breadcrumbs of the statistics page of an item, community or collection: the path of the object (as on its own
 * page) followed by "Statistics", e.g. "Home • Community • Item • Statistics"
 */
@Injectable({
  providedIn: 'root'
})
export class StatisticsBreadcrumbsService implements BreadcrumbsProviderService<ChildHALResource & DSpaceObject> {
  constructor(protected dsoBreadcrumbsService: DSOBreadcrumbsService) {
  }

  /**
   * @param key the object whose statistics are shown
   * @param url the url of the statistics page
   */
  getBreadcrumbs(key: ChildHALResource & DSpaceObject, url: string): Observable<Breadcrumb[]> {
    return this.dsoBreadcrumbsService.getBreadcrumbs(key, getDSORoute(key)).pipe(
      map((crumbs: Breadcrumb[]) => [...crumbs, new Breadcrumb('statistics.breadcrumbs', url)]),
    );
  }
}
