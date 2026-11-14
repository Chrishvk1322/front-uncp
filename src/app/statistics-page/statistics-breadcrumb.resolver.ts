import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreadcrumbConfig } from '../breadcrumbs/breadcrumb/breadcrumb-config.model';
import { CollectionBreadcrumbResolver } from '../core/breadcrumbs/collection-breadcrumb.resolver';
import { CommunityBreadcrumbResolver } from '../core/breadcrumbs/community-breadcrumb.resolver';
import { ItemBreadcrumbResolver } from '../core/breadcrumbs/item-breadcrumb.resolver';
import { DSpaceObject } from '../core/shared/dspace-object.model';
import { hasValue } from '../shared/empty.util';
import { StatisticsBreadcrumbsService } from './statistics-breadcrumbs.service';

/**
 * Resolves the breadcrumbs of /statistics/items/:id, /statistics/communities/:id and /statistics/collections/:id:
 * the object is found by the resolver of its own page, and {@link StatisticsBreadcrumbsService} adds "Statistics"
 */
@Injectable({
  providedIn: 'root'
})
export class StatisticsBreadcrumbResolver implements Resolve<BreadcrumbConfig<DSpaceObject>> {
  constructor(
    protected itemResolver: ItemBreadcrumbResolver,
    protected communityResolver: CommunityBreadcrumbResolver,
    protected collectionResolver: CollectionBreadcrumbResolver,
    protected statisticsBreadcrumbsService: StatisticsBreadcrumbsService,
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<BreadcrumbConfig<DSpaceObject>> {
    const resolvers = { items: this.itemResolver, communities: this.communityResolver, collections: this.collectionResolver };
    const resolver = resolvers[route.url[0]?.path];
    return (resolver.resolveById(route.params.id) as Observable<BreadcrumbConfig<DSpaceObject>>).pipe(
      map((config: BreadcrumbConfig<DSpaceObject>) => hasValue(config)
        ? { provider: this.statisticsBreadcrumbsService, key: config.key, url: state.url }
        : undefined),
    );
  }
}
