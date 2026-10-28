/**
 * ============================================================================================
 *  UNCP — Encabezado de las páginas de comunidad y colección (tema "uncp")
 * ============================================================================================
 *
 *  Reemplaza el encabezado de serie (título negro + "URI permanente") por un encabezado sobrio, sin caja
 *  ni fondo (rediseño del 27/10/2026 con la skill Impeccable, modo lectura/navegación), con:
 *   - el icono de la comunidad de primer nivel a la que pertenece la página (el de las tarjetas de la
 *     portada, ver shared/uncp-communities.ts), o un icono genérico (carpeta) si no se puede determinar; si la
 *     página es de una carrera con color oficial (o de una colección de ella), el círculo sólido de la carrera:
 *     su color y su icono (UNCP_CAREERS);
 *   - el nombre, la descripción corta (dc.description.abstract) si existe, y la URI permanente;
 *   - el contenido que agregue la página (logo, texto introductorio, noticias) y el menú de edición.
 *  Sin etiqueta "Comunidad"/"Colección" ni cantidad de documentos (pedido del usuario, 27/10/2026).
 *
 *  URI permanente: se muestra siempre como https://hdl.handle.net/{handle}. En producción, las 54
 *  comunidades y las 104 colecciones guardan en dc.identifier.uri la IP pública del servidor
 *  (http://38.43.155.155:4000/handle/...), que no debe mostrarse (ver bitácora, sección 8).
 *
 *  Nombre: sin el número de orden con que empiezan las comunidades de primer nivel y algunas colecciones
 *  ("1. Arquitectura e Ingenierías" → "Arquitectura e Ingenierías"; también "6.Tesis ...", sin espacio).
 *  Solo en el encabezado: las migas de pan y las listas conservan el nombre completo, que fija el orden.
 *
 *  Comunidad de primer nivel: se toma de las migas de pan, sin consultas adicionales (uncpCommunityIcon$ en
 *  shared/uncp-communities.ts, junto con uncpDisplayName).
 * ============================================================================================
 */
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { BreadcrumbsService } from '../../../../../app/breadcrumbs/breadcrumbs.service';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { Community } from '../../../../../app/core/shared/community.model';
import { map } from 'rxjs/operators';
import { uncpCareer$, uncpCareerStyle, uncpCommunityIcon$, uncpDisplayName, UNCP_GENERIC_COMMUNITY_ICON } from '../uncp-communities';

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
   * Font Awesome class of the icon of the top-level community the page belongs to, or the generic one
   */
  icon$: Observable<string> = of(UNCP_GENERIC_COMMUNITY_ICON);

  /**
   * Circle in the color of the career when the page belongs to one with an official color, otherwise null
   */
  careerStyle$: Observable<Record<string, string> | null> = of(null);

  constructor(
    private breadcrumbsService: BreadcrumbsService,
    private dsoNameService: DSONameService,
  ) {
  }

  ngOnInit(): void {
    this.name = uncpDisplayName(this.dsoNameService.getName(this.dso));
    this.uri = uncpHandleUri(this.dso.handle);
    const career$ = uncpCareer$(this.dso.uuid, this.breadcrumbsService.breadcrumbs$);
    this.icon$ = combineLatest([uncpCommunityIcon$(this.dso.uuid, this.breadcrumbsService.breadcrumbs$), career$]).pipe(
      map(([facultyIcon, career]) => career?.icon ?? facultyIcon),
    );
    this.careerStyle$ = career$.pipe(map(uncpCareerStyle));
  }
}
