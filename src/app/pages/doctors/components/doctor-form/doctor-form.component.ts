import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { DoctorPayload } from '@pages/doctors/doctor.models';
import { NgxMaskDirective } from 'ngx-mask';
import { SIGLAS_CRM, ESPECIALIDADES } from '@pages/doctors/doctor.constants';

@Component({
  selector: 'app-doctor-form',
  standalone: true,
  templateUrl: './doctor-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    NgxMaskDirective,
  ],
})
export class DoctorFormComponent implements OnChanges {
  private fb = inject(NonNullableFormBuilder);

  @Input() titulo = '';
  @Input() valorInicial: DoctorPayload | null = null;
  @Input() loading = false;
  @Output() salvar = new EventEmitter<DoctorPayload>();

  siglasCrm = SIGLAS_CRM;
  especialidades = ESPECIALIDADES;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.email]],
    crmSigla: ['', [Validators.required]],
    crmDigitos: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
    especialidade: ['', [Validators.required]],
    telefone: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorInicial'] && this.valorInicial) {
      this.form.patchValue(this.valorInicial);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.salvar.emit(this.form.getRawValue());
  }

  shouldShowError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';

    if (errors['required']) {
      return `${fieldLabel} é obrigatório.`;
    } else if (errors['email']) {
      return 'Formato de e-mail inválido (ex válido: exemplo@dominio.com).';
    } else if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldLabel} deve ter no mínimo ${requiredLength} caracteres.`;
    } else if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `${fieldLabel} deve ter no máximo ${requiredLength} caracteres.`;
    }

    return '';
  }
}
