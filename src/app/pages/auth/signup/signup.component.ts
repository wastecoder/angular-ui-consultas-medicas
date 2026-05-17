import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskDirective } from 'ngx-mask';
import { DateMaskDirective } from '@shared/directives/date-mask.directive';
import { finalize } from 'rxjs/operators';
import { AuthService } from '@services/apis/auth/auth.service';
import { SignupRequest } from '@services/apis/auth/auth.models';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SEXOS } from '@pages/patients/patient.constants';

const notFutureValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value as Date | null;
  if (!value) return null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return value.getTime() > today.getTime() ? { futureDate: true } : null;
};

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrl: '../auth-shared.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMaskDirective,
    DateMaskDirective,
  ],
})
export class SignupComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  loading = signal(false);
  senhaVisible = signal(false);
  confirmarVisible = signal(false);

  sexos = SEXOS;
  hoje = new Date();

  form = this.fb.group({
    nome: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100),
    ]),
    email: this.fb.control('', [
      Validators.required,
      Validators.email,
      Validators.minLength(5),
      Validators.maxLength(50),
    ]),
    cpf: this.fb.control('', [
      Validators.required,
      Validators.minLength(11),
      Validators.maxLength(11),
    ]),
    sexo: this.fb.control('', [Validators.required]),
    telefone: this.fb.control('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(11),
    ]),
    dataNascimento: new FormControl<Date | null>(null, {
      nonNullable: false,
      validators: [Validators.required, notFutureValidator],
    }),
    username: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(30),
    ]),
    senha: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100),
    ]),
    confirmarSenha: this.fb.control('', [Validators.required]),
  });

  toggleSenha(): void {
    this.senhaVisible.update((v) => !v);
  }

  toggleConfirmar(): void {
    this.confirmarVisible.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.senha !== raw.confirmarSenha) {
      this.form.controls.confirmarSenha.setErrors({ senhaNaoConfere: true });
      return;
    }

    const payload: SignupRequest = {
      nome: raw.nome.trim(),
      cpf: raw.cpf,
      sexo: raw.sexo,
      telefone: raw.telefone,
      dataNascimento: raw.dataNascimento ? this.toIsoDate(raw.dataNascimento) : '',
      email: raw.email.trim(),
      username: raw.username.trim(),
      senha: raw.senha,
    };

    this.loading.set(true);
    this.authService
      .signup(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          // Se o back devolver tokens (LoginResponse), AuthService já persiste a sessão.
          if (response?.accessToken) {
            this.snackbar.show('Cadastro realizado com sucesso.', 'success');
            this.router.navigate(['/']);
          } else {
            // Fallback: back sem auto-login — redirecionar para login.
            this.snackbar.show(
              'Cadastro realizado. Faça login para continuar.',
              'success'
            );
            this.router.navigate(['/login']);
          }
        },
        error: (err: HttpErrorResponse) => this.handleSignupError(err),
      });
  }

  private handleSignupError(err: HttpErrorResponse): void {
    const backMessage = err.error?.message as string | undefined;

    if (err.status === 409) {
      this.snackbar.show(
        backMessage ?? 'Já existe uma conta com este e-mail, usuário ou CPF.',
        'error'
      );
      return;
    }
    if (err.status === 400) {
      this.snackbar.show(
        backMessage ?? 'Dados inválidos. Revise o formulário.',
        'error'
      );
      return;
    }
    if (err.status === 429) {
      this.snackbar.show(
        'Muitas tentativas. Aguarde alguns minutos.',
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
    this.snackbar.show(
      backMessage ?? 'Erro inesperado ao cadastrar. Tente novamente.',
      'error'
    );
  }

  shouldShowError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';
    if (errors['required']) return `${fieldLabel} é obrigatório.`;
    if (errors['email'])
      return 'Formato de e-mail inválido (ex válido: exemplo@dominio.com).';
    if (errors['senhaNaoConfere']) return 'As senhas não conferem.';
    if (errors['futureDate']) return `${fieldLabel} não pode ser no futuro.`;
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

  // Serializa Date local como 'YYYY-MM-DD' sem aplicar UTC (espelha PatientForm).
  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
