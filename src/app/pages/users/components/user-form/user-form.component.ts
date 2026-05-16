import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Funcao } from '@shared/auth/role.types';
import { FUNCOES, FUNCAO_LABEL } from '@pages/users/user.constants';
import {
  UsuarioCreatePayload,
  UsuarioProfile,
  UsuarioUpdatePayload,
} from '@pages/users/user.models';
import { PersonAutocompleteComponent } from '@pages/appointments/components/person-autocomplete/person-autocomplete.component';
import { PessoaResumo } from '@pages/appointments/appointment.models';

export type UserFormMode = 'criar' | 'editar';

@Component({
  selector: 'app-user-form',
  standalone: true,
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    PersonAutocompleteComponent,
  ],
})
export class UserFormComponent implements OnInit, OnChanges {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);

  @Input() titulo = '';
  @Input() modo: UserFormMode = 'criar';
  @Input() valorInicial: UsuarioProfile | null = null;
  @Input() loading = false;
  @Output() salvar = new EventEmitter<
    UsuarioCreatePayload | UsuarioUpdatePayload
  >();

  funcoes = FUNCOES;
  funcaoLabel = FUNCAO_LABEL;

  form: FormGroup<{
    username: FormControl<string>;
    email: FormControl<string>;
    funcao: FormControl<Funcao | ''>;
    senha: FormControl<string>;
    confirmarSenha: FormControl<string>;
    alterarSenha: FormControl<boolean>;
  }> = this.fb.group({
    username: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(30),
    ]),
    email: this.fb.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100),
    ]),
    funcao: this.fb.control<Funcao | ''>('', [Validators.required]),
    senha: this.fb.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100),
    ]),
    confirmarSenha: this.fb.control('', [Validators.required]),
    alterarSenha: this.fb.control(false),
  });

  // Estado externo do PersonAutocomplete (não cabe direto no FormGroup acima).
  idAssociado: number | null = null;
  associadoInicial: PessoaResumo | null = null;
  associadoTocado = false;

  ngOnInit(): void {
    // No modo editar, confirmar senha começa desabilitado; senha será gerenciada
    // pelo checkbox alterarSenha.
    if (this.modo === 'editar') {
      this.form.controls.senha.disable({ emitEvent: false });
      this.form.controls.confirmarSenha.disable({ emitEvent: false });

      this.form.controls.alterarSenha.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((alterar) => {
          if (alterar) {
            this.form.controls.senha.enable();
            this.form.controls.confirmarSenha.enable();
          } else {
            this.form.controls.senha.disable();
            this.form.controls.confirmarSenha.disable();
            this.form.controls.senha.setValue('');
            this.form.controls.confirmarSenha.setValue('');
          }
        });
    }

    // Reage a mudanças de funcao para limpar idAssociado quando deixa de ser
    // MEDICO/PACIENTE — evita enviar id desatualizado ao back.
    this.form.controls.funcao.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((funcao) => {
        if (!this.exigeAssociacao(funcao)) {
          this.idAssociado = null;
          this.associadoInicial = null;
          this.associadoTocado = false;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorInicial'] && this.valorInicial) {
      this.form.patchValue({
        username: this.valorInicial.username,
        email: this.valorInicial.email,
        funcao: this.valorInicial.funcao,
      });
    }

    if (changes['modo']) {
      // No modo editar, funcao é imutável pelo back — bloquear edição.
      if (this.modo === 'editar') {
        this.form.controls.funcao.disable({ emitEvent: false });
      } else {
        this.form.controls.funcao.enable({ emitEvent: false });
      }
    }
  }

  exigeAssociacao(funcao: Funcao | '' | null): funcao is 'MEDICO' | 'PACIENTE' {
    return funcao === 'MEDICO' || funcao === 'PACIENTE';
  }

  get tipoAutocomplete(): 'medico' | 'paciente' | null {
    const f = this.form.controls.funcao.value;
    if (f === 'MEDICO') return 'medico';
    if (f === 'PACIENTE') return 'paciente';
    return null;
  }

  onAssociadoSelecionado(pessoa: PessoaResumo | null): void {
    this.idAssociado = pessoa?.id ?? null;
    this.associadoTocado = true;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.associadoTocado = true;
      return;
    }

    if (this.modo === 'criar') {
      const funcao = this.form.controls.funcao.value as Funcao;
      if (this.exigeAssociacao(funcao) && this.idAssociado == null) {
        this.associadoTocado = true;
        return;
      }

      if (
        this.form.controls.senha.value !==
        this.form.controls.confirmarSenha.value
      ) {
        this.form.controls.confirmarSenha.setErrors({ senhaNaoConfere: true });
        return;
      }

      const payload: UsuarioCreatePayload = {
        username: this.form.controls.username.value.trim(),
        email: this.form.controls.email.value.trim(),
        senha: this.form.controls.senha.value,
        funcao,
        idAssociado: this.exigeAssociacao(funcao) ? this.idAssociado : null,
      };
      this.salvar.emit(payload);
      return;
    }

    // Modo editar — só username, email e (opcionalmente) senha.
    const alterarSenha = this.form.controls.alterarSenha.value;
    if (alterarSenha) {
      if (
        this.form.controls.senha.value !==
        this.form.controls.confirmarSenha.value
      ) {
        this.form.controls.confirmarSenha.setErrors({ senhaNaoConfere: true });
        return;
      }
    }

    const payload: UsuarioUpdatePayload = {
      username: this.form.controls.username.value.trim(),
      email: this.form.controls.email.value.trim(),
      ...(alterarSenha ? { senha: this.form.controls.senha.value } : {}),
    };
    this.salvar.emit(payload);
  }

  shouldShowError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(
    errors: ValidationErrors | null,
    fieldLabel: string
  ): string {
    if (!errors) return '';

    if (errors['required']) {
      return `${fieldLabel} é obrigatório.`;
    } else if (errors['email']) {
      return 'Formato de e-mail inválido (ex válido: exemplo@dominio.com).';
    } else if (errors['senhaNaoConfere']) {
      return 'As senhas não conferem.';
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
