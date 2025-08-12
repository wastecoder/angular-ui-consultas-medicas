import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../components/login-form/login-form.component';
import { AuthService } from '@services/apis/auth/auth.service';
import { LoginCredentials } from '../login.models';

@Component({
  selector: 'app-login-home',
  standalone: true,
  templateUrl: './login-home.component.html',
  styleUrl: './login-home.component.css',
  imports: [CommonModule, LoginFormComponent],
})
export class LoginHomeComponent {
  errorMessage: string | null = null;

  constructor(private authService: AuthService) {}

  onLogin(credentials: LoginCredentials) {
    this.errorMessage = null;

    this.authService
      .login({
        username: credentials.username,
        senha: credentials.password, // conversão de password (form) para senha (back-end)
      })
      .subscribe({
        next: (res) => {
          console.log('Login successful', res);
          // TODO: redirecionar para algum lugar
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Usuário ou senha inválidos. Tente novamente.';
        },
      });
  }
}
