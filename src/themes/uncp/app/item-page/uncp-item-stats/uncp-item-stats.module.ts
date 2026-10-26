import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../../../../app/shared/shared.module';
import { UncpItemStatsComponent } from './uncp-item-stats.component';

/**
 * The UNCP "Estadísticas" block, in its own module because it is used both by the simple item page
 * (eager theme module) and by the full item page (lazy theme module)
 */
@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule,
  ],
  declarations: [UncpItemStatsComponent],
  exports: [UncpItemStatsComponent],
})
export class UncpItemStatsModule {
}
