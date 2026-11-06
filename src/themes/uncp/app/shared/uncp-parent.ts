import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { LinkService } from '../../../../app/core/cache/builders/link.service';
import { Collection } from '../../../../app/core/shared/collection.model';
import { Community } from '../../../../app/core/shared/community.model';
import { getFirstCompletedRemoteData } from '../../../../app/core/shared/operators';
import { followLink } from '../../../../app/shared/utils/follow-link-config.model';

/**
 * The community a collection or community belongs to, or null for a top-level community or when the request
 * fails. One request per object, cached by DSpace.
 */
export function uncpParent$(dso: Collection | Community, linkService: LinkService): Observable<Community | null> {
  const resolved = linkService.resolveLink<Collection | Community>(dso, followLink('parentCommunity'));
  return resolved.parentCommunity ? resolved.parentCommunity.pipe(
    getFirstCompletedRemoteData(),
    map((rd) => rd.hasSucceeded && rd.payload ? rd.payload : null),
  ) : of(null);
}
