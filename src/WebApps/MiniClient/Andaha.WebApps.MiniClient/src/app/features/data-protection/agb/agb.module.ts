import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgbComponent } from './agb.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: AgbComponent,
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        AgbComponent
    ]
})
export class AgbModule { }
