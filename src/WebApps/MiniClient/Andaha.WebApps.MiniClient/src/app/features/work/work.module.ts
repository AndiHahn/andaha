import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkComponent } from '../work/work.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

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
        loadChildren: () => import('./modules/person/person.module').then(m => m.PersonModule)
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
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ]
})
export class WorkModule { }
