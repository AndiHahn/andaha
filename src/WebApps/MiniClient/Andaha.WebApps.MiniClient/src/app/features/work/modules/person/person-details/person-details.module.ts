import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonDetailsComponent } from './person-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WorkEntryListComponent } from '../work-entry-list/work-entry-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';

const routes: Routes = [
  {
    path: '',
    component: PersonDetailsComponent
  },
  {
    path: 'working-entry/:entry-id',
    loadChildren: () => import('../work-entry-details/work-entry-details-dialog.module').then(m => m.WorkEntryDetailsDialogModule)
  }
];

@NgModule({
  declarations: [
    PersonDetailsComponent,
    WorkEntryListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule
  ]
})
export class PersonDetailsModule { }
