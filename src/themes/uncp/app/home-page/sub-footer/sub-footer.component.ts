import { Component } from '@angular/core';

export interface Institution {
  name: string;
  title: string;
  type: string;
  url: string;
  logo: string;
}

/**
 * Shows a scrolling carousel of the external platforms/indexes the repository is connected to
 * (Google Scholar, Scopus, ALICIA, Open Access Button, LA Referencia, Web of Science).
 * Displayed at the bottom of the home page.
 */
@Component({
  selector: 'ds-sub-footer',
  templateUrl: './sub-footer.component.html',
  styleUrls: ['./sub-footer.component.scss'],
})
export class SubFooterComponent {

  institutions: Institution[] = [
    {
      name: 'Google Scholar',
      title: 'Buscador de libros',
      type: 'Indexación',
      url: 'https://scholar.google.com/',
      logo: 'assets/uncp/images/partners/google.png',
    },
    {
      name: 'Scopus',
      title: 'Base de datos bibliográfica',
      type: 'Indexación',
      url: 'https://www.scopus.com/',
      logo: 'assets/uncp/images/partners/scopus.png',
    },
    {
      name: 'ALICIA',
      title: 'Repositorio Nacional',
      type: 'Networking',
      url: 'https://alicia.concytec.gob.pe/',
      logo: 'assets/uncp/images/partners/alicia.png',
    },
    {
      name: 'Open Access',
      title: 'Literatura científica',
      type: 'Indexación',
      url: 'https://openaccessbutton.org/',
      logo: 'assets/uncp/images/partners/open-access.png',
    },
    {
      name: 'LA Referencia',
      title: 'Referenciación',
      type: 'Networking',
      url: 'https://www.lareferencia.info/es/',
      logo: 'assets/uncp/images/partners/la-referencia.png',
    },
    {
      name: 'Web of Science',
      title: 'Plataforma de investigación científica',
      type: 'Indexación',
      url: 'https://mjl.clarivate.com/home',
      logo: 'assets/uncp/images/partners/web-of-science.png',
    },
  ];

  // Repeated so the CSS marquee animation (institutions.component.scss) can scroll seamlessly.
  get carouselItems(): Institution[] {
    return [...this.institutions, ...this.institutions];
  }

}
