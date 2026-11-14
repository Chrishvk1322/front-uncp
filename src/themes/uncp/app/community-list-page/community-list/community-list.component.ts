import { Component } from '@angular/core';
import { CommunityListComponent as BaseComponent } from '../../../../../app/community-list-page/community-list/community-list.component';
import { FlatNode } from '../../../../../app/community-list-page/flat-node.model';
import {
  getTopCommunity,
  UNCP_GENERIC_COMMUNITY_ICON,
  uncpCareer,
  uncpCareerStyle,
  uncpDisplayName,
} from '../../shared/uncp-communities';
import { uncpCollectionCard } from '../../shared/uncp-collection-cards';

/**
 * How a node of the UNCP tree looks: its icon, the color of its circle and its name
 */
interface UncpTreeNodeLook {
  icon: string;
  careerStyle: Record<string, string> | null;
  name: string;
  detail?: string;
}

/**
 * UNCP community list (12/11/2026): the stock tree with the look of the community pages. Faculties are card rows
 * with their icon; careers take their official color; collections show their level icon (Pregrado, Maestría...)
 * in the color of their career. Names without the order number.
 */
@Component({
  selector: 'ds-community-list',
  templateUrl: './community-list.component.html',
  styleUrls: ['../../../../../app/community-list-page/community-list/community-list.component.scss'],
})
export class CommunityListComponent extends BaseComponent {

  /**
   * Looks already computed, by node id (the tree rebuilds its nodes on every expand)
   */
  private looks = new Map<string, UncpTreeNodeLook>();

  /**
   * Icon, circle color and name of a community or collection node
   */
  look(node: FlatNode): UncpTreeNodeLook {
    let look = this.looks.get(node.id);
    if (!look) {
      const name = this.dsoNameService.getName(node.payload as any);
      if (node.route?.startsWith('/collections/')) {
        const card = uncpCollectionCard(node.id, name);
        look = { icon: card.icon, careerStyle: uncpCareerStyle(this.careerOf(node.parent)), name: card.title, detail: card.subtitle };
      } else {
        const career = uncpCareer(node.id);
        look = { icon: career?.icon ?? this.facultyIcon(node), careerStyle: uncpCareerStyle(career), name: uncpDisplayName(name) };
      }
      this.looks.set(node.id, look);
    }
    return look;
  }

  /**
   * The career of a node or of its closest ancestor, if any
   */
  private careerOf(node: FlatNode): ReturnType<typeof uncpCareer> {
    for (let current = node; current; current = current.parent) {
      const career = uncpCareer(current.id);
      if (career) {
        return career;
      }
    }
    return undefined;
  }

  /**
   * The icon of the faculty (top community) a node belongs to
   */
  private facultyIcon(node: FlatNode): string {
    let root = node;
    while (root.parent) {
      root = root.parent;
    }
    return getTopCommunity(root.id)?.icon ?? UNCP_GENERIC_COMMUNITY_ICON;
  }
}
