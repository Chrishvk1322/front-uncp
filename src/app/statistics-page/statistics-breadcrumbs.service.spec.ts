import { of as observableOf } from 'rxjs';
import { Breadcrumb } from '../breadcrumbs/breadcrumb/breadcrumb.model';
import { DSOBreadcrumbsService } from '../core/breadcrumbs/dso-breadcrumbs.service';
import { Item } from '../core/shared/item.model';
import { StatisticsBreadcrumbsService } from './statistics-breadcrumbs.service';

describe('StatisticsBreadcrumbsService', () => {
  let service: StatisticsBreadcrumbsService;
  let dsoBreadcrumbsService: jasmine.SpyObj<DSOBreadcrumbsService>;
  const item = Object.assign(new Item(), { uuid: 'item-uuid', id: 'item-uuid', type: Item.type.value, metadata: {} });
  const itemCrumbs = [new Breadcrumb('Community', '/communities/c'), new Breadcrumb('Item', '/items/item-uuid')];

  beforeEach(() => {
    dsoBreadcrumbsService = jasmine.createSpyObj('DSOBreadcrumbsService', { getBreadcrumbs: observableOf(itemCrumbs) });
    service = new StatisticsBreadcrumbsService(dsoBreadcrumbsService);
  });

  it('should add "Statistics" after the breadcrumbs of the object, asked with the page of the object', (done) => {
    service.getBreadcrumbs(item, '/statistics/items/item-uuid').subscribe((crumbs) => {
      expect(dsoBreadcrumbsService.getBreadcrumbs).toHaveBeenCalledWith(item, '/items/item-uuid');
      expect(crumbs).toEqual([...itemCrumbs, new Breadcrumb('statistics.breadcrumbs', '/statistics/items/item-uuid')]);
      done();
    });
  });
});
