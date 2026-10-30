import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkComponent } from '../work/work.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'person',
    pathMatch: 'full'
  },
  {
    path: '',
    component: WorkComponent,
    children: [
      {
        path: 'person',
        data: { title: 'Stundenaufzeichnungen' },
        loadChildren: () => import('./modules/person/person.module').then(m => m.PersonModule)
      },
      {
        path: 'statistics',
        data: { title: 'Statistik' },
        loadChildren: () => import('./modules/statistics/statistics.module').then(m => m.StatisticsModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    WorkComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule
  ]
})
export class WorkModule { }
