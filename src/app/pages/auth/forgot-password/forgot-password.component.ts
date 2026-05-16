import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { AuthService } from '@services/apis/auth/auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrl: '../auth-shared.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class ForgotPasswordComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);

  loading = signal(false);
  enviado = signal(false);

  form = this.fb.group({
    email: this.fb.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100),
    ]),
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    const email = this.form.controls.email.value.trim();

    this.authService
      .forgotPassword(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        // Mostra sucesso genérico mesmo em 4xx (proteção contra enumeração).
        next: () => this.enviado.set(true),
        error: (err: HttpErrorResponse) => {
          if (err.status === 429) {
            this.snackbar.show(
              'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
              'warning'
            );
            return;
          }
          if (err.status === 0 || err.status >= 500) {
            this.snackbar.show(
              'Servidor indisponível. Tente novamente mais tarde.',
              'error'
            );
            return;
          }
          // Demais erros (400/404 etc.) tratados como sucesso aparente.
          this.enviado.set(true);
        },
      });
  }

  shouldShowError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';
    if (errors['required']) return `${fieldLabel} é obrigatório.`;
    if (errors['email'])
      return 'Formato de e-mail inválido (ex válido: exemplo@dominio.com).';
    if (errors['maxlength']) {
      const len = errors['maxlength'].requiredLength;
      return `${fieldLabel} deve ter no máximo ${len} caracteres.`;
    }
    return '';
  }
}
