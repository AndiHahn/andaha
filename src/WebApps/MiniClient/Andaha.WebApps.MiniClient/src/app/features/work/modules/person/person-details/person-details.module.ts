import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonDetailsComponent } from './person-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WorkEntryListComponent } from '../work-entry-list/work-entry-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

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
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatNativeDateModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        ShowErrorModule,
        PersonDetailsComponent,
        WorkEntryListComponent
    ]
})
export class PersonDetailsModule { }
