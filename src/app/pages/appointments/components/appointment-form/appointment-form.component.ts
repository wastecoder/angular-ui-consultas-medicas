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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskDirective } from 'ngx-mask';
import { DateMaskDirective } from '@shared/directives/date-mask.directive';
import {
  ConsultaCadastroPayload,
  ConsultaProfile,
  PessoaResumo,
} from '@pages/appointments/appointment.models';
import {
  DURACAO_PADRAO,
  DURACOES_DISPONIVEIS,
  MOTIVO_MAX_CHARS,
} from '@pages/appointments/appointment.constants';
import { PersonAutocompleteComponent } from '../person-autocomplete/person-autocomplete.component';

// Bloqueia datas anteriores a hoje (digitação manual contorna o [min] do datepicker).
const notPastValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value as Date | null;
  if (!value) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(value);
  v.setHours(0, 0, 0, 0);
  return v.getTime() < hoje.getTime() ? { pastDate: true } : null;
};

const isWeekend = (d: Date): boolean => d.getDay() === 0 || d.getDay() === 6;

// Bloqueia sábado/domingo (digitação manual contorna o matDatepickerFilter).
const notWeekendValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const v = control.value as Date | null;
  if (!v) return null;
  return isWeekend(v) ? { weekendDate: true } : null;
};

// Aceita string mascarada brasileira ("1.234,56") e valida >= 0.
const precoMinValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const raw = (control.value ?? '').toString();
  if (!raw) return null;
  const numero = Number(raw.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numero)) return { precoInvalido: true };
  return numero < 0 ? { min: { min: 0, actual: numero } } : null;
};

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatIconModule,
    NgxMaskDirective,
    DateMaskDirective,
    PersonAutocompleteComponent,
  ],
})
export class AppointmentFormComponent implements OnChanges {
  private fb = inject(NonNullableFormBuilder);

  @Input() titulo = '';
  @Input() valorInicial: ConsultaProfile | null = null;
  @Input() loading = false;
  // Quando preenchido (fluxo de agendamento pelo paciente), o paciente fica
  // travado neste valor e o autocomplete de paciente não é exibido.
  @Input() pacienteFixo: PessoaResumo | null = null;
  @Output() salvar = new EventEmitter<ConsultaCadastroPayload>();

  readonly motivoMax = MOTIVO_MAX_CHARS;
  readonly duracoes = DURACOES_DISPONIVEIS;
  readonly hoje = this.zeroHoras(new Date());
  readonly weekendFilter = (d: Date | null): boolean => !d || !isWeekend(d);

  medicoInicial: PessoaResumo | null = null;
  pacienteInicial: PessoaResumo | null = null;
  pessoasTocadas = false;

  form = this.fb.group({
    dataAtendimento: new FormControl<Date | null>(null, {
      nonNullable: false,
      validators: [Validators.required, notPastValidator, notWeekendValidator],
    }),
    horarioAtendimento: ['', [Validators.required]],
    duracaoEmMinutos: [DURACAO_PADRAO, [Validators.required]],
    preco: ['', [Validators.required, precoMinValidator]],
    motivo: ['', [Validators.required, Validators.maxLength(MOTIVO_MAX_CHARS)]],
    medicoId: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required],
    }),
    pacienteId: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required],
    }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorInicial'] && this.valorInicial) {
      const v = this.valorInicial;
      this.medicoInicial = v.medico ?? null;
      this.pacienteInicial = v.paciente ?? null;
      this.form.patchValue({
        dataAtendimento: this.parseIsoDate(v.dataAtendimento),
        horarioAtendimento: this.normalizeHora(v.horarioAtendimento),
        duracaoEmMinutos: v.duracaoEmMinutos ?? DURACAO_PADRAO,
        preco: this.formatPrecoParaMascara(v.preco),
        motivo: v.motivo,
        medicoId: v.medico?.id ?? null,
        pacienteId: v.paciente?.id ?? null,
      });
    }

    if (changes['pacienteFixo'] && this.pacienteFixo) {
      this.form.controls.pacienteId.setValue(this.pacienteFixo.id);
    }
  }

  onMedicoSelecionado(pessoa: PessoaResumo | null): void {
    this.form.controls.medicoId.setValue(pessoa?.id ?? null);
    this.form.controls.medicoId.markAsTouched();
  }

  onPacienteSelecionado(pessoa: PessoaResumo | null): void {
    this.form.controls.pacienteId.setValue(pessoa?.id ?? null);
    this.form.controls.pacienteId.markAsTouched();
  }

  onSubmit(): void {
    this.pessoasTocadas = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: ConsultaCadastroPayload = {
      dataAtendimento: raw.dataAtendimento
        ? this.toIsoDate(raw.dataAtendimento)
        : '',
      horarioAtendimento: this.normalizeHora(raw.horarioAtendimento),
      duracaoEmMinutos: Number(raw.duracaoEmMinutos),
      preco: this.parsePreco(raw.preco),
      motivo: raw.motivo,
      medicoId: Number(raw.medicoId),
      pacienteId: Number(raw.pacienteId),
    };
    this.salvar.emit(payload);
  }

  shouldShowError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  // Abre o seletor nativo de horário ao clicar no ícone Material (browsers modernos).
  // Antes do showPicker, foca o input para que o teclado e a UI respondam.
  abrirSeletorHora(input: HTMLInputElement): void {
    input.focus();
    const showPicker = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (typeof showPicker === 'function') {
      showPicker.call(input);
    }
  }

  getErrorMessage(errors: ValidationErrors | null, fieldLabel: string): string {
    if (!errors) return '';

    if (errors['required']) {
      return `${fieldLabel} é obrigatório.`;
    } else if (errors['pastDate']) {
      return `${fieldLabel} não pode ser no passado.`;
    } else if (errors['weekendDate']) {
      return `${fieldLabel} deve ser dia útil (segunda a sexta).`;
    } else if (errors['matDatepickerFilter']) {
      return `${fieldLabel} deve ser dia útil (segunda a sexta).`;
    } else if (errors['precoInvalido']) {
      return `${fieldLabel} inválido.`;
    } else if (errors['min']) {
      return `${fieldLabel} deve ser no mínimo ${errors['min'].min}.`;
    } else if (errors['max']) {
      return `${fieldLabel} deve ser no máximo ${errors['max'].max}.`;
    } else if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `${fieldLabel} deve ter no máximo ${requiredLength} caracteres.`;
    }

    return '';
  }

  private parseIsoDate(iso: string): Date | null {
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private normalizeHora(hora: string): string {
    if (!hora) return '';
    return hora.length >= 5 ? hora.substring(0, 5) : hora;
  }

  private zeroHoras(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private parsePreco(raw: string): number {
    const normalizado = (raw ?? '').toString().replace(/\./g, '').replace(',', '.');
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  // Número (ex.: 1234.5) → "1234,50" — ngx-mask injeta o ponto de milhar na exibição.
  private formatPrecoParaMascara(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
    return Number(valor).toFixed(2).replace('.', ',');
  }
}
