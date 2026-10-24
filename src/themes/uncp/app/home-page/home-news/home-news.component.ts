import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';

@Component({
  selector: 'ds-home-news',
  styleUrls: ['./home-news.component.scss'],
  templateUrl: './home-news.component.html'
})

/**
 * Component to render the news section on the home page
 */
export class HomeNewsComponent extends BaseComponent implements AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    super();
  }

  /**
   * Bootstrap only auto-starts [data-ride="carousel"] once, on window load. Angular renders the
   * home page later (after its data resolves), so the carousel has to be started here.
   */
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      (window as any).jQuery?.('#carouselExampleCaptions').carousel({ interval: 5000 });
    }
  }
}
