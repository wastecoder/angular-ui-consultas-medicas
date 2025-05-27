import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MedicoHomeComponent } from './medicos/medico-home/medico-home.component';
import { NovoMedicoComponent } from './medicos/novo-medico/novo-medico.component';
import { ListaMedicoComponent } from './medicos/lista-medico/lista-medico.component';
import { EditaMedicoComponent } from './medicos/edita-medico/edita-medico.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { title: 'Página Inicial' } },
  {
    path: 'medicos',
    data: { title: 'Médicos' },
    children: [
      {
        path: '',
        component: MedicoHomeComponent,
        data: { title: 'Página Inicial de Médicos' },
      },
      {
        path: 'novo',
        component: NovoMedicoComponent,
        data: { title: 'Novo Médico' },
      },
      {
        path: 'lista',
        component: ListaMedicoComponent,
        data: { title: 'Lista de Médicos' },
      },
      {
        path: 'editar/:id',
        component: EditaMedicoComponent,
        data: { title: 'Editar Médico' },
      },
    ],
  },
];
