import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/bill/bill.module').then(m => m.BillModule)
  },
  {
    path: 'budgetplan',
    loadChildren: () => import('./features/budgetplan/budgetplan.module').then(m => m.BudgetplanModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: 'data-protection',
    loadChildren: () => import('./features/data-protection/data-protection/data-protection.module').then(m => m.DataProtectionModule)
  },
  {
    path: 'agb',
    loadChildren: () => import('./features/data-protection/agb/agb.module').then(m => m.AgbModule)
  },
  {
    path: 'user-data',
    loadChildren: () => import('./features/data-protection/user-data/user-data.module').then(m => m.UserDataModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
