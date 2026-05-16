import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { PatientService } from '@services/apis/patient/patient.service';
import { PessoaResumo } from '@pages/appointments/appointment.models';

export type PersonAutocompleteTipo = 'medico' | 'paciente';

@Component({
  selector: 'app-person-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  templateUrl: './person-autocomplete.component.html',
  styleUrl: './person-autocomplete.component.css',
})
export class PersonAutocompleteComponent implements OnInit, OnChanges {
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) tipo!: PersonAutocompleteTipo;
  @Input({ required: true }) label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() valorInicial: PessoaResumo | null = null;
  @Input() disabled = false;
  @Input() obrigatorio = false;
  @Input() tocado = false;
  @Output() selecionado = new EventEmitter<PessoaResumo | null>();

  @ViewChild(MatAutocompleteTrigger) private trigger?: MatAutocompleteTrigger;

  readonly control = new FormControl<string | PessoaResumo>('', { nonNullable: true });
  sugestoes$: Observable<PessoaResumo[]> = of([]);

  private ultimoValorEraPessoa = false;

  ngOnInit(): void {
    // Sugestões: emite uma busca inicial vazia (carrega top 10) e reage ao digitar.
    this.sugestoes$ = this.control.valueChanges.pipe(
      startWith(this.control.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        if (this.isPessoa(value)) {
          return of([] as PessoaResumo[]);
        }
        const termo = String(value ?? '').trim();
        return this.buscar(termo).pipe(catchError(() => of([] as PessoaResumo[])));
      })
    );

    // Reação separada: invalida a seleção quando o usuário substitui uma pessoa
    // selecionada por texto livre (evita enviar id desatualizado ao back).
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const ehPessoa = this.isPessoa(value);
        if (this.ultimoValorEraPessoa && !ehPessoa) {
          this.selecionado.emit(null);
        }
        this.ultimoValorEraPessoa = ehPessoa;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorInicial']) {
      if (this.valorInicial) {
        this.control.setValue(this.valorInicial, { emitEvent: false });
        this.ultimoValorEraPessoa = true;
      } else {
        this.control.setValue('', { emitEvent: false });
        this.ultimoValorEraPessoa = false;
      }
    }

    if (changes['disabled']) {
      this.disabled
        ? this.control.disable({ emitEvent: false })
        : this.control.enable({ emitEvent: false });
    }
  }

  displayPessoa = (pessoa: PessoaResumo | string | null): string => {
    if (!pessoa) return '';
    return typeof pessoa === 'string' ? pessoa : pessoa.nome;
  };

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const pessoa = event.option.value as PessoaResumo;
    this.selecionado.emit(pessoa);
  }

  onBlur(): void {
    // Sair do campo sem selecionar opção garante que nenhum id antigo permaneça.
    if (!this.isPessoa(this.control.value)) {
      this.selecionado.emit(null);
    }
  }

  abrirPainel(): void {
    // setTimeout evita conflito com o ciclo de detection do focus do Material.
    setTimeout(() => this.trigger?.openPanel(), 0);
  }

  get mostrarErroObrigatorio(): boolean {
    return this.obrigatorio && this.tocado && !this.isPessoa(this.control.value);
  }

  private isPessoa(value: unknown): value is PessoaResumo {
    return !!value && typeof value === 'object' && 'id' in (value as object);
  }

  private buscar(nome: string): Observable<PessoaResumo[]> {
    if (this.tipo === 'medico') {
      return this.doctorService
        .listarComFiltros(0, 10, { nome: nome || undefined, ativo: true })
        .pipe(
          switchMap((page) =>
            of(page.content.map((d) => ({ id: d.id, nome: d.nome })))
          )
        );
    }
    return this.patientService
      .listarComFiltros(0, 10, { nome: nome || undefined, ativo: true })
      .pipe(
        switchMap((page) =>
          of(page.content.map((p) => ({ id: p.id, nome: p.nome })))
        )
      );
  }
}
