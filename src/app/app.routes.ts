import { Routes } from '@angular/router';
import { HomeComponent } from '@pages/home/home.component';
import { DoctorCreateComponent } from '@pages/doctors/doctor-create/doctor-create.component';
import { DoctorListComponent } from '@pages/doctors/doctor-list/doctor-list.component';
import { DoctorEditComponent } from '@pages/doctors/doctor-edit/doctor-edit.component';
import { DoctorProfileComponent } from '@pages/doctors/doctor-profile/doctor-profile.component';
import { DoctorFilterHomeComponent } from '@pages/doctors/doctor-filter/doctor-filter-home/doctor-filter-home.component';
import { LoginHomeComponent } from '@pages/login/login-home/login-home.component';
import { LayoutFullComponent } from './layouts/layout-full/layout-full.component';
import { LayoutBlankComponent } from './layouts/layout-blank/layout-blank.component';
import { LogoutComponent } from '@pages/logout/logout.component';
import { authGuard } from '@guards/auth.guard';

export const routes: Routes = [
  // Rotas com layout completo (navbar + footer)
  {
    path: '',
    component: LayoutFullComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        data: { title: 'Página Inicial' },
      },
      {
        path: 'doctors',
        data: { title: 'Médicos' },
        children: [
          {
            path: '',
            component: DoctorListComponent,
            data: { title: 'Lista de Médicos' },
          },
          {
            path: 'create',
            component: DoctorCreateComponent,
            data: { title: 'Novo Médico' },
          },
          {
            path: ':id/edit',
            component: DoctorEditComponent,
            data: { title: 'Editar Médico' },
          },
          {
            path: ':id/profile',
            component: DoctorProfileComponent,
            data: { title: 'Perfil do Médico' },
          },
          {
            path: 'filter',
            component: DoctorFilterHomeComponent,
            data: { title: 'Filtrar Médico' },
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
      {
        path: 'logout',
        component: LogoutComponent,
        canActivate: [authGuard],
        data: { title: 'Logout' },
      },
    ],
  },

  // Rota coringa
  { path: '**', redirectTo: 'login' },
];
