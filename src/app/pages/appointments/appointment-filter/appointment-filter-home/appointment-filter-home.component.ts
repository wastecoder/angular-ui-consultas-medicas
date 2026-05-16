import {
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import {
  AppointmentTableComponent,
  ConsultaModel,
} from '../../components/appointment-table/appointment-table.component';
import { AppointmentService } from '@services/apis/appointment/appointment.service';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { PatientService } from '@services/apis/patient/patient.service';
import {
  ConsultaFilter,
  ConsultaSort,
  ConsultaSortField,
  PessoaResumo,
} from '@pages/appointments/appointment.models';
import {
  STATUS_CONSULTA,
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { SnackbarService } from '@shared/services/snackbar.service';

interface FiltrosAtivos {
  filtros: ConsultaFilter;
  medico: PessoaResumo | null;
  paciente: PessoaResumo | null;
}

@Component({
  selector: 'app-appointment-filter-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AppointmentTableComponent,
  ],
  templateUrl: './appointment-filter-home.component.html',
  styleUrl: './appointment-filter-home.component.css',
})
export class AppointmentFilterHomeComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusList = STATUS_CONSULTA;
  readonly statusLabel = STATUS_CONSULTA_LABEL;

  pageResponse: PageResponse<ConsultaModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  activeState = signal<FiltrosAtivos>({
    filtros: {},
    medico: null,
    paciente: null,
  });

  sort: ConsultaSort = { ordenarPor: 'dataAtendimento', direcao: 'asc' };

  currentPage = 0;

  filterBarOpen = signal(false);

  // Drafts do formulário inline.
  // - draftData usa Date | null para integrar com o Material datepicker;
  //   é convertido para 'YYYY-MM-DD' ao aplicar o filtro.
  // - Os autocompletes guardam o objeto selecionado em paralelo ao FormControl
  //   (que pode ter string livre quando o usuário digita sem selecionar opção).
  draftData: Date | null = null;
  draftStatus: StatusConsulta | '' = '';

  draftMedicoControl = new FormControl<string | PessoaResumo>('', { nonNullable: true });
  draftMedicoSelecionado: PessoaResumo | null = null;

  draftPacienteControl = new FormControl<string | PessoaResumo>('', { nonNullable: true });
  draftPacienteSelecionado: PessoaResumo | null = null;

  medicosSugeridos$: Observable<PessoaResumo[]> = of([]);
  pacientesSugeridos$: Observable<PessoaResumo[]> = of([]);

  chips = computed(() => {
    const state = this.activeState();
    const data = state.filtros.dataAtendimento
      ? this.formatDateBR(state.filtros.dataAtendimento)
      : '';
    const medico = state.medico?.nome ?? '';
    const paciente = state.paciente?.nome ?? '';
    const status = state.filtros.status
      ? STATUS_CONSULTA_LABEL[state.filtros.status]
      : '';
    return { data, medico, paciente, status };
  });

  hasAnyChip = computed(() => {
    const c = this.chips();
    return Boolean(c.data || c.medico || c.paciente || c.status);
  });

  displayPessoa = (pessoa: PessoaResumo | string | null): string => {
    if (!pessoa) return '';
    return typeof pessoa === 'string' ? pessoa : pessoa.nome;
  };

  ngOnInit(): void {
    this.medicosSugeridos$ = this.criarStreamSugestoes(
      this.draftMedicoControl,
      (nome) =>
        this.doctorService.listarComFiltros(0, 10, {
          nome: nome || undefined,
          ativo: true,
        })
    );

    this.pacientesSugeridos$ = this.criarStreamSugestoes(
      this.draftPacienteControl,
      (nome) =>
        this.patientService.listarComFiltros(0, 10, {
          nome: nome || undefined,
          ativo: true,
        })
    );

    // Quando o usuário substitui uma seleção por texto livre, invalida o id resolvido.
    this.draftMedicoControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        if (!this.isPessoa(v)) this.draftMedicoSelecionado = null;
      });

    this.draftPacienteControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        if (!this.isPessoa(v)) this.draftPacienteSelecionado = null;
      });

    this.loadAppointmentsWithFilters();
  }

  loadAppointmentsWithFilters(
    page: number = this.currentPage,
    size: number = this.pageResponse.size
  ): void {
    this.appointmentService
      .listarComFiltros(page, size, this.activeState().filtros, this.sort)
      .subscribe({
        next: (data) => {
          this.pageResponse = data;
          this.currentPage = page;
        },
        error: (error) => {
          console.error('Erro ao carregar consultas:', error);
          const errorMessage =
            error.error?.message ?? 'Erro ao carregar consultas.';
          this.snackbar.show(errorMessage, 'error');
        },
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.loadAppointmentsWithFilters(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as ConsultaSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  toggleFilterBar() {
    if (!this.filterBarOpen()) {
      this.hydrateDraftsFromActive();
    }
    this.filterBarOpen.update((open) => !open);
  }

  onDraftMedicoSelecionado(pessoa: PessoaResumo) {
    this.draftMedicoSelecionado = pessoa;
  }

  onDraftPacienteSelecionado(pessoa: PessoaResumo) {
    this.draftPacienteSelecionado = pessoa;
  }

  applyDraftFilters() {
    const filtros: ConsultaFilter = {
      dataAtendimento: this.draftData ? this.toIsoDate(this.draftData) : undefined,
      medicoId: this.draftMedicoSelecionado?.id,
      pacienteId: this.draftPacienteSelecionado?.id,
      status: this.draftStatus || undefined,
    };

    this.activeState.set({
      filtros,
      medico: this.draftMedicoSelecionado,
      paciente: this.draftPacienteSelecionado,
    });
    this.filterBarOpen.set(false);
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  clearData() {
    this.activeState.update((s) => ({
      ...s,
      filtros: { ...s.filtros, dataAtendimento: undefined },
    }));
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  clearMedico() {
    this.activeState.update((s) => ({
      ...s,
      filtros: { ...s.filtros, medicoId: undefined },
      medico: null,
    }));
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  clearPaciente() {
    this.activeState.update((s) => ({
      ...s,
      filtros: { ...s.filtros, pacienteId: undefined },
      paciente: null,
    }));
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  clearStatus() {
    this.activeState.update((s) => ({
      ...s,
      filtros: { ...s.filtros, status: undefined },
    }));
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  clearAll() {
    this.activeState.set({ filtros: {}, medico: null, paciente: null });
    this.draftData = null;
    this.draftStatus = '';
    this.draftMedicoSelecionado = null;
    this.draftPacienteSelecionado = null;
    this.draftMedicoControl.setValue('', { emitEvent: false });
    this.draftPacienteControl.setValue('', { emitEvent: false });
    this.filterBarOpen.set(false);
    this.loadAppointmentsWithFilters(0, this.pageResponse.size);
  }

  update(consulta: ConsultaModel) {
    this.router.navigate(['/appointments', consulta.id, 'edit']);
  }

  viewProfile(consulta: ConsultaModel) {
    this.router.navigate(['/appointments', consulta.id, 'profile']);
  }

  private hydrateDraftsFromActive() {
    const state = this.activeState();
    this.draftData = state.filtros.dataAtendimento
      ? this.parseIsoDate(state.filtros.dataAtendimento)
      : null;
    this.draftStatus = state.filtros.status ?? '';

    this.draftMedicoSelecionado = state.medico;
    this.draftMedicoControl.setValue(state.medico ?? '', { emitEvent: false });

    this.draftPacienteSelecionado = state.paciente;
    this.draftPacienteControl.setValue(state.paciente ?? '', { emitEvent: false });
  }

  private criarStreamSugestoes(
    control: FormControl<string | PessoaResumo>,
    buscar: (nome: string) => Observable<PageResponse<{ id: number; nome: string }>>
  ): Observable<PessoaResumo[]> {
    return control.valueChanges.pipe(
      startWith(control.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        if (this.isPessoa(value)) return of([] as PessoaResumo[]);
        const termo = String(value ?? '').trim();
        return buscar(termo).pipe(
          map((page) => page.content.map((p) => ({ id: p.id, nome: p.nome }))),
          catchError(() => of([] as PessoaResumo[]))
        );
      })
    );
  }

  private isPessoa(value: unknown): value is PessoaResumo {
    return !!value && typeof value === 'object' && 'id' in (value as object);
  }

  private formatDateBR(iso: string): string {
    const d = this.parseIsoDate(iso);
    return d ? d.toLocaleDateString('pt-BR') : '';
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
}
