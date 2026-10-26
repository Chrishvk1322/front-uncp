/**
 * ============================================================================================
 *  UNCP — Visitas y descargas en la ficha del ítem (tema "uncp")
 * ============================================================================================
 *
 *  Componente propio del Repositorio Institucional UNCP; no existe en DSpace de serie.
 *  Bloque "Estadísticas" (👁 Visitas · ⬇ Descargas) que se muestra después de la sección de
 *  archivos, en la ficha simple y en la completa. Se agregó para la evaluación de repositorios
 *  de Concytec; en el frontend anterior lo insertaba el script assets/custom/uncp-estadisticas.js
 *  (ver frontend-personalizacion.md, sección 3 y anexo A).
 *
 *  Datos: informes de uso de la API de estadísticas, consultados sin sesión:
 *   - visitas:   /server/api/statistics/usagereports/{uuid}_TotalVisits    (un punto: el ítem)
 *   - descargas: /server/api/statistics/usagereports/{uuid}_TotalDownloads (un punto por archivo; se suman)
 *
 *  Reglas:
 *   - solo en el navegador: en SSR no se consulta nada (ni los bots ni la caché de SSR generan
 *     consultas o guardan cifras viejas);
 *   - si cualquiera de las dos consultas falla, no se muestra el bloque, igual que antes.
 * ============================================================================================
 */
import { ChangeDetectionStrategy, Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Item } from '../../../../../app/core/shared/item.model';
import { UsageReport } from '../../../../../app/core/statistics/models/usage-report.model';
import { UsageReportDataService } from '../../../../../app/core/statistics/usage-report-data.service';
import { getFirstCompletedRemoteData } from '../../../../../app/core/shared/operators';

/**
 * Visits and downloads of an item
 */
export interface UncpItemStats {
  visitas: number;
  descargas: number;
}

@Component({
  selector: 'ds-uncp-item-stats',
  templateUrl: './uncp-item-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Not provided in root by DSpace (only in the lazy statistics page module)
  providers: [UsageReportDataService],
})
export class UncpItemStatsComponent implements OnInit {

  /**
   * The item whose statistics are shown
   */
  @Input() item: Item;

  /**
   * The figures, or null when they are not available (SSR, or either report failed)
   */
  stats$: Observable<UncpItemStats | null> = of(null);

  constructor(
    private usageReportService: UsageReportDataService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.item) {
      return;
    }
    this.stats$ = combineLatest([
      this.total('TotalVisits'),
      this.total('TotalDownloads'),
    ]).pipe(
      map(([visitas, descargas]) => (visitas === null || descargas === null) ? null : { visitas, descargas }),
    );
  }

  /**
   * Sum of the views of all points of a usage report, or null if the report failed.
   * getFirstCompletedRemoteData (not getStatistic(), which waits forever when the request fails).
   */
  private total(reportType: string): Observable<number | null> {
    return this.usageReportService.findById(`${this.item.uuid}_${reportType}`).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? this.sumViews(rd.payload) : null),
      catchError(() => of(null)),
    );
  }

  private sumViews(report: UsageReport): number {
    return (report?.points ?? []).reduce((sum, point) => sum + this.views(point?.values), 0);
  }

  /**
   * Views of a point. The REST API sends `values` as an object ({ views: 132 }), although the DSpace
   * model types it as an array, so both shapes are accepted.
   */
  private views(values: unknown): number {
    const list = Array.isArray(values) ? values : [values];
    return list.reduce((sum: number, v: any) => sum + (Number(v?.views) || 0), 0);
  }
}
