/**
 * ============================================================================================
 *  UNCP — Título de la pestaña del navegador sin números de orden (tema "uncp")
 * ============================================================================================
 *
 *  Las comunidades de primer nivel y algunas colecciones empiezan con un número de orden
 *  ("1. Arquitectura e Ingenierías", "6.Tesis de pre y posgrado ..."). El encabezado de la página ya lo
 *  oculta (ver uncp-comcol-header); este servicio hace lo mismo en el título de la pestaña, que DSpace
 *  arma con el nombre en dos formas:
 *   - página de comunidad o colección: "1. Arquitectura e Ingenierías";
 *   - pestañas de "Examinar": "Repositorio Institucional UNCP :: Examinando 1. Arquitectura e Ingenierías por Autor".
 *
 *  Reemplaza al servicio Title de Angular (registrado en eager-theme.module.ts), así que cubre todo
 *  título que fije DSpace sin tocar el núcleo. Solo quita un número seguido de punto al inicio del
 *  título, después de " :: " o después de "Examinando "/"Browsing ".
 * ============================================================================================
 */
import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';

/**
 * The title without the order numbers of community and collection names
 */
export function uncpStripOrderNumbers(title: string): string {
  return (title ?? '').replace(/(^|:: |Examinando |Browsing )\d+\.\s*(?=\D)/g, '$1');
}

@Injectable()
export class UncpTitleService extends Title {

  constructor(@Inject(DOCUMENT) document: any) {
    super(document);
  }

  setTitle(newTitle: string): void {
    super.setTitle(uncpStripOrderNumbers(newTitle));
  }
}
