import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LoginCredentials } from '../../login.models';

@Component({
  selector: 'app-login-form',
  standalone: true,
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
})
export class LoginFormComponent {
  @Output() login = new EventEmitter<LoginCredentials>();
  @Input() errorMessage: string | null = null;
  @Input() loading = false;

  credentials: LoginCredentials = {
    username: '',
    password: '',
    rememberMe: false,
  };

  passwordVisible = false;

  onSubmit() {
    this.login.emit(this.credentials);
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  shouldShowError(control: NgModel | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';
    if (errors['required']) {
      return `${fieldLabel} é obrigatório.`;
    } else if (errors['minlength']) {
      return `${fieldLabel} deve ter pelo menos ${errors['minlength'].requiredLength} caracteres.`;
    }
    return '';
  }
}
