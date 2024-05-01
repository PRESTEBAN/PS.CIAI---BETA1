import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Principal2Page } from './principal2.page';

const routes: Routes = [
  {
    path: '',
    component: Principal2Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Principal2PageRoutingModule {}
