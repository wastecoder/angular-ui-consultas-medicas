import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@services/apis/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css',
})
export class LogoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  onLogout(): void {
    this.authService.logout();
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }
}
