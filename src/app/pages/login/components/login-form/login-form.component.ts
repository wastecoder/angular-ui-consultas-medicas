import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoginCredentials } from '../../login.models';

@Component({
  selector: 'app-login-form',
  standalone: true,
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class LoginFormComponent {
  @Output() login = new EventEmitter<LoginCredentials>();
  @Input() errorMessage: string | null = null;

  credentials: LoginCredentials = {
    username: '',
    password: '',
  };

  onSubmit() {
    this.login.emit(this.credentials);
  }

  shouldShowError(control: NgModel | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';
    if (errors['required']) {
      return `${fieldLabel} is required.`;
    } else if (errors['minlength']) {
      return `${fieldLabel} must be at least ${errors['minlength'].requiredLength} characters.`;
    }
    return '';
  }
}
