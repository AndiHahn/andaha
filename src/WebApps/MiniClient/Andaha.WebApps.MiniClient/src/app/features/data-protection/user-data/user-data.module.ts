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
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        UserDataComponent
    ]
})
export class UserDataModule { }
