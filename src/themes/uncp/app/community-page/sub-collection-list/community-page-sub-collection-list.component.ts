import { Component, inject, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommunityPageSubCollectionListComponent as BaseComponent } from '../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component';
import { fadeIn } from '../../../../../app/shared/animations/fade';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { BreadcrumbsService } from '../../../../../app/breadcrumbs/breadcrumbs.service';
import { uncpCareer$, uncpCareerStyle, uncpDisplayName } from '../../shared/uncp-communities';
import { UNCP_COMCOL_PAGE_SIZE } from '../sub-community-list/community-page-sub-community-list.component';

/**
 * A collection as shown on its card
 */
export interface UncpCollectionCard {
  uuid: string;
  /** "Pregrado", "Maestría"... for thesis collections, otherwise the name */
  title: string;
  /** The full name, when the title is only the level */
  subtitle?: string;
  icon: string;
  order: number;
}

/**
 * Thesis levels, in the order the cards are shown, with their icon
 */
const LEVELS = [
  { pattern: /pregrado/i, label: 'Pregrado', icon: 'fa-graduation-cap' },
  { pattern: /segunda especialidad/i, label: 'Segunda Especialidad', icon: 'fa-certificate' },
  { pattern: /maestr[ií]a/i, label: 'Maestría', icon: 'fa-scroll' },
  { pattern: /doctorado/i, label: 'Doctorado', icon: 'fa-award' },
];

/**
 * Names that are only "[Tesis] <level> - <program>" ("Tesis - Pregrado - Ingeniería de Sistemas",
 * "Tesis Doctorado - ...", "Maestría-Ingeniería Química Ambiental")
 */
const LEVEL_NAME = /^(tesis\s*-?\s*)?(pregrado|segunda especialidad|maestr[ií]a|doctorado)\s*-\s*\S/i;

/**
 * Icon of the collections that are not of a thesis level
 */
const OTHER_ICONS = [
  { pattern: /libro/i, icon: 'fa-book' },
  { pattern: /art[ií]culo/i, icon: 'fa-newspaper' },
  { pattern: /embargo/i, icon: 'fa-lock' },
  { pattern: /tesis/i, icon: 'fa-graduation-cap' },
];

/**
 * The card of a collection: thesis collections show their level as title (in the community of the program
 * the rest of the name is redundant) and are sorted Pregrado → Segunda Especialidad → Maestría → Doctorado;
 * the others keep their name (without order number) and go after them, alphabetically
 */
export function uncpCollectionCard(uuid: string, name: string): UncpCollectionCard {
  const fullName = uncpDisplayName(name);
  const levelIndex = LEVELS.findIndex((level) => level.pattern.test(fullName));
  const level = LEVELS[levelIndex];
  if (level && LEVEL_NAME.test(fullName)) {
    return { uuid, title: level.label, subtitle: fullName, icon: level.icon, order: levelIndex };
  }
  return {
    uuid,
    title: fullName,
    icon: level?.icon ?? OTHER_ICONS.find((other) => other.pattern.test(fullName))?.icon ?? 'fa-folder-open',
    order: LEVELS.length,
  };
}

/**
 * UNCP collections of a community: a grid of cards instead of the stock list of links, all on one page. In a
 * career with an official color, the icon circles (Pregrado, Maestría, Doctorado...) take that color.
 */
@Component({
  selector: 'ds-community-page-sub-collection-list',
  styleUrls: ['../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component.scss'],
  templateUrl: './community-page-sub-collection-list.component.html',
  animations: [fadeIn]
})
export class CommunityPageSubCollectionListComponent extends BaseComponent implements OnInit {

  private dsoNameService = inject(DSONameService);

  private breadcrumbsService = inject(BreadcrumbsService);

  /**
   * Icon circles in the color of the career the collections belong to (the community of the page, or the
   * career in its breadcrumbs), or null for the neutral look
   */
  careerStyle$: Observable<Record<string, string> | null> = of(null);

  /**
   * The cards of the current page, sorted
   */
  cards$: Observable<UncpCollectionCard[]> = this.subCollectionsRDObs.pipe(
    map((rd) => (rd?.payload?.page ?? [])
      .map((collection: Collection) => uncpCollectionCard(collection.uuid, this.dsoNameService.getName(collection)))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'es'))),
  );

  ngOnInit(): void {
    this.pageSize = this.pageSize ?? UNCP_COMCOL_PAGE_SIZE;
    super.ngOnInit();
    this.careerStyle$ = uncpCareer$(this.community.uuid, this.breadcrumbsService.breadcrumbs$).pipe(map(uncpCareerStyle));
  }
}
