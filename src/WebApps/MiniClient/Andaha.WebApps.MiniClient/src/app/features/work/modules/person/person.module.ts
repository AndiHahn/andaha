import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonComponent } from './person.component';
import { PersonListComponent } from './person-list/person-list.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    component: PersonComponent
  },
  {
    path: 'create',
    data: { title: 'Person hinzufügen', back: '/work/person' },
    loadChildren: () => import('./add-person/add-person.module').then(m => m.AddPersonModule)
  },
  {
    path: 'create-working-entry',
    data: { title: 'Arbeitszeiten hinzufügen', back: '/work/person' },
    loadChildren: () => import('./add-working-entry/add-working-entry.module').then(m => m.AddWorkingEntryModule)
  },
  {
    path: ':id',
    data: { title: 'Person', back: '/work/person' },
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
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class PersonModule { }
