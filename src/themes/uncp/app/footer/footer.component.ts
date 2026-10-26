import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FooterComponent as BaseComponent } from '../../../../app/footer/footer.component';
import { UncpTotalesService } from '../shared/uncp-totales.service';

/**
 * Figures of the "Estadísticas" block
 */
interface FooterStats {
  documentos: number;
  autores: number;
  comunidades: number;
  colecciones: number;
}

/**
 * Fallback figures, shown during SSR, until uncp-totales.json arrives, or when it is missing or invalid.
 * Values of uncp-totales.json on 2026-10-24 (production showed 11,568 / 1896 / 28 / 75, a year out of date).
 */
const RESPALDO: FooterStats = {
  documentos: 14626,
  autores: 18159,
  comunidades: 54,
  colecciones: 104,
};

/**
 * UNCP dark "modern-footer" (recovered from production). The "Estadísticas" figures come from
 * uncp-totales.json, generated daily by the server cron (see UncpTotalesService).
 */
@Component({
  selector: 'ds-footer',
  styleUrls: ['./footer.component.scss'],
  templateUrl: './footer.component.html'
})
export class FooterComponent extends BaseComponent {

  stats$: Observable<FooterStats> = inject(UncpTotalesService).getTotales().pipe(
    map((t) => ({
      documentos: t?.documentos ?? RESPALDO.documentos,
      autores: t?.autores ?? RESPALDO.autores,
      comunidades: t?.comunidades ?? RESPALDO.comunidades,
      colecciones: t?.colecciones ?? RESPALDO.colecciones,
    })),
    startWith(RESPALDO),
  );
}
