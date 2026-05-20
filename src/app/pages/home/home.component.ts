import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { HasRoleDirective } from '@shared/auth/has-role.directive';
import { AuthService } from '@services/apis/auth/auth.service';
import { RecepcionistaDashboardComponent } from '@pages/recepcionista/recepcionista-dashboard.component';
import { AdminDashboardComponent } from '@pages/admin/admin-dashboard.component';
import { MedicoDashboardComponent } from '@pages/medico/medico-dashboard.component';
import { PacienteDashboardComponent } from '@pages/paciente/paciente-dashboard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    HasRoleDirective,
    RecepcionistaDashboardComponent,
    AdminDashboardComponent,
    MedicoDashboardComponent,
    PacienteDashboardComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);

  isAdmin = signal(this.auth.hasRole('ADMIN'));
  isRecepcionista = signal(this.auth.hasRole('RECEPCIONISTA'));
  isMedico = signal(this.auth.hasRole('MEDICO'));
  isPaciente = signal(this.auth.hasRole('PACIENTE'));

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe(() => {
      this.isAdmin.set(this.auth.hasRole('ADMIN'));
      this.isRecepcionista.set(this.auth.hasRole('RECEPCIONISTA'));
      this.isMedico.set(this.auth.hasRole('MEDICO'));
      this.isPaciente.set(this.auth.hasRole('PACIENTE'));
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
