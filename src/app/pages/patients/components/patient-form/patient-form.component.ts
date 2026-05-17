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
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PacientePayload } from '@pages/patients/patient.models';
import { NgxMaskDirective } from 'ngx-mask';
import { DateMaskDirective } from '@shared/directives/date-mask.directive';
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
  selector: 'app-patient-form',
  standalone: true,
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    NgxMaskDirective,
    DateMaskDirective,
  ],
})
export class PatientFormComponent implements OnChanges {
  private fb = inject(NonNullableFormBuilder);

  @Input() titulo = '';
  @Input() valorInicial: PacientePayload | null = null;
  @Input() loading = false;
  @Output() salvar = new EventEmitter<PacientePayload>();

  sexos = SEXOS;
  hoje = new Date();

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.email]],
    cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    sexo: ['', [Validators.required]],
    telefone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]],
    dataNascimento: new FormControl<Date | null>(null, {
      nonNullable: false,
      validators: [Validators.required, notFutureValidator],
    }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorInicial'] && this.valorInicial) {
      const { dataNascimento, ...rest } = this.valorInicial;
      this.form.patchValue({
        ...rest,
        dataNascimento: this.parseIsoDate(dataNascimento),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const dataIso = raw.dataNascimento
      ? this.toIsoDate(raw.dataNascimento)
      : '';
    const payload: PacientePayload = {
      nome: raw.nome,
      email: raw.email,
      cpf: raw.cpf,
      sexo: raw.sexo,
      telefone: raw.telefone,
      dataNascimento: dataIso,
    };
    this.salvar.emit(payload);
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
    } else if (errors['futureDate']) {
      return `${fieldLabel} não pode ser no futuro.`;
    } else if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldLabel} deve ter no mínimo ${requiredLength} caracteres.`;
    } else if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `${fieldLabel} deve ter no máximo ${requiredLength} caracteres.`;
    }

    return '';
  }

  // Constrói Date local a partir de 'YYYY-MM-DD' evitando deslocamento por timezone.
  private parseIsoDate(iso: string): Date | null {
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  // Serializa Date local como 'YYYY-MM-DD' sem aplicar UTC.
  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
