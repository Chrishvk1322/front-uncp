/**
 * ============================================================================================
 *  UNCP — Encabezado de las páginas de comunidad y colección (tema "uncp")
 * ============================================================================================
 *
 *  Reemplaza el encabezado de serie (título negro + "URI permanente") por un encabezado sobrio, sin caja
 *  ni fondo (rediseño del 27/10/2026 con la skill Impeccable, modo lectura/navegación), con:
 *   - el icono de la comunidad de primer nivel a la que pertenece la página (el de las tarjetas de la
 *     portada, ver shared/uncp-communities.ts), o un icono genérico si no se puede determinar;
 *   - el nombre, la descripción corta (dc.description.abstract) si existe, y la URI permanente;
 *   - el contenido que agregue la página (logo, texto introductorio, noticias) y el menú de edición.
 *  Sin etiqueta "Comunidad"/"Colección" ni cantidad de documentos (pedido del usuario, 27/10/2026).
 *
 *  URI permanente: se muestra siempre como https://hdl.handle.net/{handle}. En producción, las 54
 *  comunidades y las 104 colecciones guardan en dc.identifier.uri la IP pública del servidor
 *  (http://38.43.155.155:4000/handle/...), que no debe mostrarse (ver bitácora, sección 8).
 *
 *  Comunidad de primer nivel: se toma de las migas de pan, que ya resuelven toda la cadena de comunidades
 *  padre (/communities/{uuid}); no hace consultas adicionales.
 * ============================================================================================
 */
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { BreadcrumbsService } from '../../../../../app/breadcrumbs/breadcrumbs.service';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { Community } from '../../../../../app/core/shared/community.model';
import { getTopCommunity } from '../uncp-communities';

/**
 * The permanent URI of a handle, always on hdl.handle.net, whatever host the stored dc.identifier.uri has
 */
export function uncpHandleUri(uri: string): string {
  const match = /(?:\/handle\/|hdl\.handle\.net\/)(.+)$/.exec(uri ?? '');
  return match ? `https://hdl.handle.net/${match[1]}` : uri;
}

@Component({
  selector: 'ds-uncp-comcol-header',
  templateUrl: './uncp-comcol-header.component.html',
  styleUrls: ['./uncp-comcol-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UncpComcolHeaderComponent implements OnInit {

  /**
   * The community or collection of the page
   */
  @Input() dso: Community | Collection;

  /**
   * i18n key of the label in front of the permanent URI
   */
  @Input() uriLabel: string;

  name: string;

  uri: string;

  /**
   * Icon of the top-level community the page belongs to, or null for the generic icon
   */
  icon$: Observable<string | null> = of(null);

  constructor(
    private breadcrumbsService: BreadcrumbsService,
    private dsoNameService: DSONameService,
  ) {
  }

  ngOnInit(): void {
    this.name = this.dsoNameService.getName(this.dso);
    this.uri = uncpHandleUri(this.dso.handle);
    const ownIcon = getTopCommunity(this.dso.uuid)?.icon ?? null;
    this.icon$ = ownIcon ? of(ownIcon) : this.breadcrumbsService.breadcrumbs$.pipe(
      // the replayed breadcrumbs of the previous page don't contain this page
      filter((crumbs) => crumbs.some((crumb) => crumb.url?.includes(this.dso.uuid))),
      map((crumbs) => crumbs
        .map((crumb) => /\/communities\/([0-9a-f-]{36})/.exec(crumb.url ?? '')?.[1])
        .map((uuid) => getTopCommunity(uuid)?.icon)
        .find((icon) => !!icon) ?? null),
      startWith(null),
    );
  }
}
