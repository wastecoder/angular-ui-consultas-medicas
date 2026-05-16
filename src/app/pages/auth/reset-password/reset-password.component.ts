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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { AuthService } from '@services/apis/auth/auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
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
export class ResetPasswordComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  novaSenhaVisible = signal(false);
  confirmarVisible = signal(false);

  private token = this.route.snapshot.queryParamMap.get('token') ?? '';
  tokenAusente = !this.token;

  form = this.fb.group({
    novaSenha: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100),
    ]),
    confirmarSenha: this.fb.control('', [Validators.required]),
  });

  toggleNovaSenha(): void {
    this.novaSenhaVisible.update((v) => !v);
  }

  toggleConfirmar(): void {
    this.confirmarVisible.update((v) => !v);
  }

  onSubmit(): void {
    if (this.tokenAusente || this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const novaSenha = this.form.controls.novaSenha.value;
    const confirmar = this.form.controls.confirmarSenha.value;
    if (novaSenha !== confirmar) {
      this.form.controls.confirmarSenha.setErrors({ senhaNaoConfere: true });
      return;
    }

    this.loading.set(true);
    this.authService
      .resetPassword(this.token, novaSenha)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show(
            'Senha redefinida com sucesso. Faça login com a nova senha.',
            'success'
          );
          this.router.navigate(['/login']);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 400 || err.status === 401 || err.status === 404) {
            this.snackbar.show(
              'Link inválido ou expirado. Solicite um novo.',
              'error'
            );
            this.router.navigate(['/forgot-password']);
            return;
          }
          if (err.status === 0 || err.status >= 500) {
            this.snackbar.show(
              'Servidor indisponível. Tente novamente mais tarde.',
              'error'
            );
            return;
          }
          this.snackbar.show(
            'Não foi possível redefinir a senha. Tente novamente.',
            'error'
          );
        },
      });
  }

  shouldShowError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';
    if (errors['required']) return `${fieldLabel} é obrigatório.`;
    if (errors['senhaNaoConfere']) return 'As senhas não conferem.';
    if (errors['minlength']) {
      const len = errors['minlength'].requiredLength;
      return `${fieldLabel} deve ter no mínimo ${len} caracteres.`;
    }
    if (errors['maxlength']) {
      const len = errors['maxlength'].requiredLength;
      return `${fieldLabel} deve ter no máximo ${len} caracteres.`;
    }
    return '';
  }
}
