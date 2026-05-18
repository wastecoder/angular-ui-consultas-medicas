import { Routes } from '@angular/router';
import { HomeComponent } from '@pages/home/home.component';
import { DoctorCreateComponent } from '@pages/doctors/doctor-create/doctor-create.component';
import { DoctorListComponent } from '@pages/doctors/doctor-list/doctor-list.component';
import { DoctorEditComponent } from '@pages/doctors/doctor-edit/doctor-edit.component';
import { DoctorProfileComponent } from '@pages/doctors/doctor-profile/doctor-profile.component';
import { DoctorFilterHomeComponent } from '@pages/doctors/doctor-filter/doctor-filter-home/doctor-filter-home.component';
import { PatientCreateComponent } from '@pages/patients/patient-create/patient-create.component';
import { PatientListComponent } from '@pages/patients/patient-list/patient-list.component';
import { PatientEditComponent } from '@pages/patients/patient-edit/patient-edit.component';
import { PatientProfileComponent } from '@pages/patients/patient-profile/patient-profile.component';
import { PatientFilterHomeComponent } from '@pages/patients/patient-filter/patient-filter-home/patient-filter-home.component';
import { AppointmentCreateComponent } from '@pages/appointments/appointment-create/appointment-create.component';
import { AppointmentListComponent } from '@pages/appointments/appointment-list/appointment-list.component';
import { AppointmentEditComponent } from '@pages/appointments/appointment-edit/appointment-edit.component';
import { AppointmentProfileComponent } from '@pages/appointments/appointment-profile/appointment-profile.component';
import { AppointmentFilterHomeComponent } from '@pages/appointments/appointment-filter/appointment-filter-home/appointment-filter-home.component';
import { UserCreateComponent } from '@pages/users/user-create/user-create.component';
import { UserListComponent } from '@pages/users/user-list/user-list.component';
import { UserEditComponent } from '@pages/users/user-edit/user-edit.component';
import { UserProfileComponent } from '@pages/users/user-profile/user-profile.component';
import { UserFilterHomeComponent } from '@pages/users/user-filter/user-filter-home/user-filter-home.component';
import { OperationalDashboardComponent } from '@pages/dashboards/operational/operational-dashboard.component';
import { FinancialDashboardComponent } from '@pages/dashboards/financial/financial-dashboard.component';
import { AppointmentsDashboardComponent } from '@pages/dashboards/appointments/appointments-dashboard.component';
import { MedicoDashboardComponent } from '@pages/dashboards/medico/medico-dashboard.component';
import { PatientDashboardComponent } from '@pages/dashboards/paciente/paciente-dashboard.component';
import { ProdutividadeDashboardComponent } from '@pages/dashboards/produtividade/produtividade-dashboard.component';
import { LoginHomeComponent } from '@pages/auth/login/login-home/login-home.component';
import { SignupComponent } from '@pages/auth/signup/signup.component';
import { ForgotPasswordComponent } from '@pages/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '@pages/auth/reset-password/reset-password.component';
import { LayoutFullComponent } from './layouts/layout-full/layout-full.component';
import { LayoutBlankComponent } from './layouts/layout-blank/layout-blank.component';
import { LogoutComponent } from '@pages/logout/logout.component';
import { authGuard } from '@guards/auth.guard';
import { roleGuard } from '@guards/role.guard';

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
        canActivate: [authGuard],
        data: { title: 'Médicos' },
        children: [
          {
            path: '',
            component: DoctorListComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Lista de Médicos' },
          },
          {
            path: 'create',
            component: DoctorCreateComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Novo Médico' },
          },
          {
            path: ':id/edit',
            component: DoctorEditComponent,
            canActivate: [roleGuard(['ADMIN'])],
            data: { title: 'Editar Médico' },
          },
          {
            path: ':id/profile',
            component: DoctorProfileComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Perfil do Médico' },
          },
          {
            path: 'filter',
            component: DoctorFilterHomeComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Filtrar Médico' },
          },
        ],
      },
      {
        path: 'patients',
        canActivate: [authGuard],
        data: { title: 'Pacientes' },
        children: [
          {
            path: '',
            component: PatientListComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Lista de Pacientes' },
          },
          {
            path: 'create',
            component: PatientCreateComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Novo Paciente' },
          },
          {
            path: ':id/edit',
            component: PatientEditComponent,
            canActivate: [roleGuard(['ADMIN'])],
            data: { title: 'Editar Paciente' },
          },
          {
            path: ':id/profile',
            component: PatientProfileComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Perfil do Paciente' },
          },
          {
            path: 'filter',
            component: PatientFilterHomeComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Filtrar Paciente' },
          },
        ],
      },
      {
        path: 'appointments',
        canActivate: [authGuard],
        data: { title: 'Consultas' },
        children: [
          {
            path: '',
            component: AppointmentListComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Lista de Consultas' },
          },
          {
            path: 'create',
            component: AppointmentCreateComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Nova Consulta' },
          },
          {
            path: ':id/edit',
            component: AppointmentEditComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Editar Consulta' },
          },
          {
            path: ':id/profile',
            component: AppointmentProfileComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Perfil da Consulta' },
          },
          {
            path: 'filter',
            component: AppointmentFilterHomeComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Filtrar Consulta' },
          },
        ],
      },
      {
        path: 'users',
        canActivate: [authGuard],
        data: { title: 'Usuários' },
        children: [
          {
            path: '',
            component: UserListComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Lista de Usuários' },
          },
          {
            path: 'create',
            component: UserCreateComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Novo Usuário' },
          },
          {
            path: ':id/edit',
            component: UserEditComponent,
            canActivate: [roleGuard(['ADMIN'])],
            data: { title: 'Editar Usuário' },
          },
          {
            path: ':id/profile',
            component: UserProfileComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Perfil do Usuário' },
          },
          {
            path: 'filter',
            component: UserFilterHomeComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Filtrar Usuários' },
          },
        ],
      },
      {
        path: 'dashboards',
        canActivate: [authGuard],
        data: { title: 'Dashboards' },
        children: [
          {
            path: 'operacional',
            component: OperationalDashboardComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Dashboard Operacional' },
          },
          {
            path: 'financeiro',
            component: FinancialDashboardComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Dashboard Financeiro' },
          },
          {
            path: 'consultas',
            component: AppointmentsDashboardComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Dashboard de Consultas' },
          },
          {
            path: 'medico',
            component: MedicoDashboardComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Dashboard Médico' },
          },
          {
            path: 'paciente',
            component: PatientDashboardComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Dashboard de Pacientes' },
          },
          {
            path: 'produtividade',
            component: ProdutividadeDashboardComponent,
            canActivate: [roleGuard(['ADMIN', 'RECEPCIONISTA'])],
            data: { title: 'Dashboard de Produtividade' },
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
        path: 'signup',
        component: SignupComponent,
        data: { title: 'Criar conta' },
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        data: { title: 'Recuperar senha' },
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        data: { title: 'Redefinir senha' },
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
