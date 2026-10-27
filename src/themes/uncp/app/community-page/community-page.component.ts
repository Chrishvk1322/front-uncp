import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommunityPageComponent as BaseComponent } from '../../../../app/community-page/community-page.component';
import { fadeInOut } from '../../../../app/shared/animations/fade';

/**
 * UNCP community page: the stock page with the UNCP header (shared/uncp-comcol-header)
 */
@Component({
  selector: 'ds-community-page',
  templateUrl: './community-page.component.html',
  styleUrls: ['../../../../app/community-page/community-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut]
})
export class CommunityPageComponent extends BaseComponent {}
