import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DataProtectionComponent } from './data-protection.component';

const routes: Routes = [
  {
    path: '',
    component: DataProtectionComponent,
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        DataProtectionComponent
    ]
})
export class DataProtectionModule { }
