import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionComponent } from './connection.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';




const routes: Routes = [
  {
    path: '',
    component: ConnectionComponent,
  }
];

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    ConnectionComponent
],
    providers: []
})
export class ConnectionModule { }
