import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { DatosComponent } from "./components/datos/datos.component";
import { DatosCorreoComponent } from "./components/datos-correo/datos-correo.component";
import { CardsPersonalidadComponent } from "./components/cards-personalidad/cards-personalidad.component";
import { CardsPersonalidadcorreoComponent } from "./components/cards-personalidadcorreo/cards-personalidadcorreo.component";
const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'chat',
    loadChildren: () => import('./chat/chat.module').then( m => m.ChatPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'sign-up',
    loadChildren: () => import('./sign-up/sign-up.module').then( m => m.SignUpPageModule)
  },
  { path: 'datos', component: DatosComponent },
  { path: 'datos-correo', component: DatosCorreoComponent },
  { path: 'cards-personalidad', component: CardsPersonalidadComponent },
  { path: 'cards-personalidadcorreo', component: CardsPersonalidadcorreoComponent },
  {
    path: 'principal',
    loadChildren: () => import('./principal/principal.module').then( m => m.PrincipalPageModule)
  },
  {
    path: 'principal/nombre',
    loadChildren: () => import('./principal/principal.module').then( m => m.PrincipalPageModule)
  },
  {
    path: 'principal2',
    loadChildren: () => import('./principal2/principal2.module').then( m => m.Principal2PageModule)
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account.module').then( m => m.AccountPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
