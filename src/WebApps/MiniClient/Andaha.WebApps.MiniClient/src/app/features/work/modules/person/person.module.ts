import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonComponent } from './person.component';
import { PersonListComponent } from './person-list/person-list.component';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    component: PersonComponent
  },
  {
    path: 'create',
    loadChildren: () => import('./add-person/add-person.module').then(m => m.AddPersonModule)
  },
  {
    path: 'create-working-entry',
    loadChildren: () => import('./add-working-entry/add-working-entry.module').then(m => m.AddWorkingEntryModule)
  },
  {
    path: ':id',
    loadChildren: () => import('./person-details/person-details.module').then(m => m.PersonDetailsModule)
  }
];

@NgModule({
  declarations: [
    PersonComponent,
    PersonListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class PersonModule { }
