import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDataComponent } from './user-data.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: UserDataComponent,
  }
];

@NgModule({
  declarations: [ UserDataComponent ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class UserDataModule { }
