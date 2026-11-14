import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { CommunityListComponent as BaseComponent } from '../../../../../app/community-list-page/community-list/community-list.component';
import { FlatNode } from '../../../../../app/community-list-page/flat-node.model';
import {
  getTopCommunity,
  UNCP_GENERIC_COMMUNITY_ICON,
  uncpCareer,
  uncpCareerStyle,
  uncpDisplayName,
  uncpInheritedCareer,
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
 * The tree's nodes with the collections of each community in the order of the career page (14/11/2026, user
 * request): Pregrado first, then Segunda Especialidad, Maestría and Doctorado, and the other collections after
 * them alphabetically (uncpCollectionCard().order). The stock service gives them alphabetically (Doctorado,
 * Maestría, Pregrado). Only consecutive collections of the same parent are reordered; communities, "show more"
 * nodes and the descendants of each node keep their place.
 * @param nodes the flat nodes of the tree
 * @param nameOf the name of a node
 */
export function uncpSortTreeCollections(nodes: FlatNode[], nameOf: (node: FlatNode) => string): FlatNode[] {
  const isCollection = (node: FlatNode) => !node.isShowMoreNode && !!node.route?.startsWith('/collections/');
  const result: FlatNode[] = [];
  for (let i = 0; i < nodes.length;) {
    if (!isCollection(nodes[i])) {
      result.push(nodes[i++]);
      continue;
    }
    // a run of collections of the same parent (collections are leaves, so no descendants in between)
    const run: FlatNode[] = [];
    const parent = nodes[i].parent?.id;
    while (i < nodes.length && isCollection(nodes[i]) && nodes[i].parent?.id === parent) {
      run.push(nodes[i++]);
    }
    const key = (node: FlatNode) => {
      const card = uncpCollectionCard(node.id, nameOf(node));
      return { order: card.order, name: uncpDisplayName(nameOf(node)) };
    };
    result.push(...run
      .map((node) => ({ node, ...key(node) }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'))
      .map((entry) => entry.node));
  }
  return result;
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
export class CommunityListComponent extends BaseComponent implements OnInit {

  /**
   * Looks already computed, by node id (the tree rebuilds its nodes on every expand)
   */
  private looks = new Map<string, UncpTreeNodeLook>();

  ngOnInit() {
    super.ngOnInit();
    // collections in the order of the career page (see uncpSortTreeCollections)
    const connect = this.dataSource.connect.bind(this.dataSource);
    this.dataSource.connect = (viewer) => connect(viewer).pipe(
      map((nodes: FlatNode[]) => uncpSortTreeCollections(nodes, (node) => this.dsoNameService.getName(node.payload as any))),
    );
  }

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
        // the faculty in its color; a career in its official color, or else in its faculty's
        look = { icon: uncpCareer(node.id)?.icon ?? this.facultyIcon(node), careerStyle: uncpCareerStyle(this.careerOf(node)),
          name: uncpDisplayName(name) };
      }
      this.looks.set(node.id, look);
    }
    return look;
  }

  /**
   * The color of a node or of its closest ancestor: a career with an official color, or else the faculty
   */
  private careerOf(node: FlatNode): ReturnType<typeof uncpCareer> {
    for (let current = node; current; current = current.parent) {
      const career = uncpInheritedCareer(current.id);
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
