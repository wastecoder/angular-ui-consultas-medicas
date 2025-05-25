import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MedicoHomeComponent } from './medicos/medico-home/medico-home.component';
import { NovoMedicoComponent } from './medicos/novo-medico/novo-medico.component';
import { ListaMedicoComponent } from './medicos/lista-medico/lista-medico.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'medicos',
    children: [
      { path: '', component: MedicoHomeComponent },
      { path: 'novo', component: NovoMedicoComponent },
      { path: 'lista', component: ListaMedicoComponent },
    ],
  },
];
