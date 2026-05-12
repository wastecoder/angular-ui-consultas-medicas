import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginFormComponent } from '../components/login-form/login-form.component';
import { AuthService } from '@services/apis/auth/auth.service';
import { LoginCredentials } from '../login.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-home',
  standalone: true,
  templateUrl: './login-home.component.html',
  styleUrl: './login-home.component.css',
  imports: [CommonModule, LoginFormComponent],
})
export class LoginHomeComponent {
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(credentials: LoginCredentials) {
    this.errorMessage = null;

    this.authService
      .login(
        {
          username: credentials.username,
          senha: credentials.password, // conversão de password (form) para senha (back-end)
        },
        credentials.rememberMe
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.mapLoginError(err);
        },
      });
  }

  private mapLoginError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
        return 'Usuário ou senha inválidos. Tente novamente.';
      case 429:
        return 'Muitas tentativas. Tente novamente em alguns instantes.';
      case 0:
        return 'Servidor indisponível. Verifique sua conexão.';
      default:
        return 'Erro inesperado. Tente novamente mais tarde.';
    }
  }
}
