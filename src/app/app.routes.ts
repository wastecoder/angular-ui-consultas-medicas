import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MedicoHomeComponent } from './medicos/medico-home/medico-home.component';
import { NovoMedicoComponent } from './medicos/novo-medico/novo-medico.component';
import { ListaMedicoComponent } from './medicos/lista-medico/lista-medico.component';
import { EditaMedicoComponent } from './medicos/edita-medico/edita-medico.component';
import { LoginHomeComponent } from './login/login-home/login-home.component';
import { LayoutFullComponent } from './layouts/layout-full/layout-full.component';
import { LayoutBlankComponent } from './layouts/layout-blank/layout-blank.component';

export const routes: Routes = [
  // Rotas com layout completo (navbar + footer)
  {
    path: '',
    component: LayoutFullComponent,
    children: [
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
    ],
  },

  // Rotas com layout em branco (sem navbar/footer)
  {
    path: '',
    component: LayoutBlankComponent,
    children: [
      {
        path: 'login',
        component: LoginHomeComponent,
        data: { title: 'Login' },
      },
    ],
  },

  // Rota coringa
  { path: '**', redirectTo: 'login' },
];
