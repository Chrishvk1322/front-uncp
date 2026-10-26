/**
 * ============================================================================================
 *  UNCP — Totales del repositorio (tema "uncp")
 * ============================================================================================
 *
 *  Archivo propio del Repositorio Institucional UNCP; no existe en DSpace de serie.
 *  Lee /assets/custom/uncp-totales.json, que genera una vez al día (05:00) el cron del servidor
 *  /opt/dspace/scripts/uncp_totales_pie.sh (copia versionada en servidor/uncp_totales_pie.sh).
 *
 *  Usado por:
 *   - el pie de página (bloque "Estadísticas"): documentos, autores, comunidades y colecciones;
 *   - las tarjetas de comunidades de la portada: documentos por comunidad (comunidades_inicio).
 *
 *  Reglas (ver frontend-personalizacion.md, secciones 2 y 5):
 *   - el archivo se pide una sola vez por carga del sitio y solo en el navegador: en SSR no se
 *     consulta nada, así ni los bots ni la caché de SSR generan peticiones o guardan cifras viejas;
 *   - no se consulta la API REST: cero consultas al backend por visita;
 *   - solo se aceptan números enteros positivos; si el archivo falta o una cifra no es válida,
 *     cada componente muestra su cifra fija de respaldo.
 * ============================================================================================
 */
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

/**
 * Ruta del archivo, relativa al sitio. En producción la sirve nginx (no forma parte del build).
 */
export const UNCP_TOTALES_URL = '/assets/custom/uncp-totales.json';

/**
 * Totales validados. Las cifras inválidas o ausentes quedan en undefined.
 */
export interface UncpTotales {
  documentos?: number;
  autores?: number;
  comunidades?: number;
  colecciones?: number;
  /** Documentos por comunidad de primer nivel, por UUID */
  comunidadesInicio: Record<string, number>;
  /** Fecha y hora del cálculo, tal como la escribe el cron */
  actualizado?: string;
}

const esCifraValida = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0;

const cifra = (n: unknown): number | undefined => esCifraValida(n) ? n : undefined;

@Injectable({ providedIn: 'root' })
export class UncpTotalesService {

  private totales$: Observable<UncpTotales | null>;

  /**
   * Cliente HTTP sin los interceptores de DSpace: es un archivo estático, no la API REST,
   * así que no debe llevar el token de sesión ni pasar por el manejo de errores de la API.
   */
  private http: HttpClient;

  constructor(
    httpBackend: HttpBackend,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.http = new HttpClient(httpBackend);
  }

  /**
   * Los totales del día, o null si no están disponibles (en SSR, o si el archivo falta o no es válido).
   */
  getTotales(): Observable<UncpTotales | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }
    if (!this.totales$) {
      this.totales$ = this.http.get<any>(UNCP_TOTALES_URL, { headers: new HttpHeaders({ 'Cache-Control': 'no-cache' }) }).pipe(
        map((json) => this.validar(json)),
        catchError(() => of(null)),
        shareReplay(1),
      );
    }
    return this.totales$;
  }

  private validar(json: any): UncpTotales | null {
    if (json === null || typeof json !== 'object') {
      return null;
    }
    const comunidadesInicio: Record<string, number> = {};
    const porComunidad = json.comunidades_inicio;
    if (porComunidad !== null && typeof porComunidad === 'object') {
      Object.keys(porComunidad)
        .filter((uuid) => esCifraValida(porComunidad[uuid]))
        .forEach((uuid) => comunidadesInicio[uuid] = porComunidad[uuid]);
    }
    return {
      documentos: cifra(json.documentos),
      autores: cifra(json.autores),
      comunidades: cifra(json.comunidades),
      colecciones: cifra(json.colecciones),
      comunidadesInicio,
      actualizado: typeof json.actualizado === 'string' ? json.actualizado : undefined,
    };
  }
}
