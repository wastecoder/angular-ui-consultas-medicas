import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { HasRoleDirective } from '@shared/auth/has-role.directive';
import { AuthService } from '@services/apis/auth/auth.service';
import { RecepcionistaDashboardComponent } from '@pages/recepcionista/recepcionista-dashboard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    HasRoleDirective,
    RecepcionistaDashboardComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);

  isRecepcionista = signal(this.auth.hasRole('RECEPCIONISTA'));

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe(() =>
      this.isRecepcionista.set(this.auth.hasRole('RECEPCIONISTA'))
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
