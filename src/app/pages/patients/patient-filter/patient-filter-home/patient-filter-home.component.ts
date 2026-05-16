import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import {
  PatientTableComponent,
  PacienteModel,
} from '../../components/patient-table/patient-table.component';
import { PatientService } from '@services/apis/patient/patient.service';
import {
  PacienteFilter,
  PacienteSort,
  PacienteSortField,
} from '@pages/patients/patient.models';
import { SEXOS } from '@pages/patients/patient.constants';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';
import { FormattingService } from '@shared/services/formatting.service';

type StatusOption = 'todos' | 'ativo' | 'inativo';

@Component({
  selector: 'app-patient-filter-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    NgxMaskDirective,
    PatientTableComponent,
  ],
  templateUrl: './patient-filter-home.component.html',
  styleUrl: './patient-filter-home.component.css',
})
export class PatientFilterHomeComponent implements OnInit {
  private readonly pacienteService = inject(PatientService);
  private snackbar = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly formatting = inject(FormattingService);

  readonly sexos = SEXOS;

  pageResponse: PageResponse<PacienteModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  activeFilters = signal<PacienteFilter>({ ativo: true });

  sort: PacienteSort = { ordenarPor: 'nome', direcao: 'asc' };

  currentPage = 0;

  filterBarOpen = signal(false);

  // Drafts do formulário inline (preenchidos quando a barra abre)
  draftStatus: StatusOption = 'ativo';
  draftNome: string = '';
  draftCpf: string = '';
  draftSexo: string = '';

  chips = computed(() => {
    const filters = this.activeFilters();

    const status =
      filters.ativo === true
        ? 'Ativo'
        : filters.ativo === false
        ? 'Inativo'
        : '';

    const nome = filters.nome?.trim() ?? '';

    const cpf = filters.cpf ? this.formatting.formatCpf(filters.cpf) : '';

    const sexo = filters.sexo ? this.titleCase(filters.sexo) : '';

    return { status, nome, cpf, sexo };
  });

  hasAnyChip = computed(() => {
    const c = this.chips();
    return Boolean(c.status || c.nome || c.cpf || c.sexo);
  });

  ngOnInit(): void {
    this.loadPatientsWithFilters();
  }

  loadPatientsWithFilters(
    page: number = this.currentPage,
    size: number = this.pageResponse.size
  ): void {
    this.pacienteService
      .listarComFiltros(page, size, this.activeFilters(), this.sort)
      .subscribe({
        next: (data) => {
          this.pageResponse = data;
          this.currentPage = page;
        },
        error: (error) => {
          console.error('Erro ao carregar pacientes:', error);
          const errorMessage =
            error.error?.message ?? 'Erro ao carregar pacientes.';
          this.snackbar.show(errorMessage, 'error');
        },
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.loadPatientsWithFilters(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as PacienteSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  toggleFilterBar() {
    if (!this.filterBarOpen()) {
      this.hydrateDraftsFromActiveFilters();
    }
    this.filterBarOpen.update((open) => !open);
  }

  setDraftStatus(value: StatusOption) {
    this.draftStatus = value;
  }

  applyDraftFilters() {
    const status = this.draftStatus;
    const nome = this.draftNome.trim();
    const cpf = this.draftCpf.trim();
    const sexo = this.draftSexo;

    const filters: PacienteFilter = {
      ativo:
        status === 'ativo' ? true : status === 'inativo' ? false : undefined,
      nome: nome || undefined,
      cpf: cpf || undefined,
      sexo: sexo || undefined,
    };

    this.activeFilters.set(filters);
    this.filterBarOpen.set(false);
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  clearStatus() {
    this.activeFilters.update((f) => ({ ...f, ativo: undefined }));
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  clearNome() {
    this.activeFilters.update((f) => ({ ...f, nome: undefined }));
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  clearCpf() {
    this.activeFilters.update((f) => ({ ...f, cpf: undefined }));
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  clearSexo() {
    this.activeFilters.update((f) => ({ ...f, sexo: undefined }));
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  clearAll() {
    this.activeFilters.set({ ativo: true });
    this.draftStatus = 'ativo';
    this.draftNome = '';
    this.draftCpf = '';
    this.draftSexo = '';
    this.filterBarOpen.set(false);
    this.loadPatientsWithFilters(0, this.pageResponse.size);
  }

  update(paciente: PacienteModel) {
    this.router.navigate(['/patients', paciente.id, 'edit']);
  }

  viewProfile(paciente: PacienteModel) {
    this.router.navigate(['/patients', paciente.id, 'profile']);
  }

  async toggleAtivo(paciente: PacienteModel): Promise<void> {
    const willActivate = !paciente.ativo;
    const acao = willActivate ? 'ativar' : 'inativar';

    const confirmed = await this.dialogService.confirm({
      title: `${willActivate ? 'Ativar' : 'Inativar'} paciente`,
      content: `Tem certeza que deseja ${acao} o paciente ${paciente.nome}?`,
      type: willActivate ? 'activate' : 'deactivate',
    });

    if (!confirmed) {
      return;
    }

    const request$ = willActivate
      ? this.pacienteService.ativar(paciente.id)
      : this.pacienteService.inativar(paciente.id);

    request$.subscribe({
      next: () => {
        this.snackbar.show(
          `Paciente ${willActivate ? 'ativado' : 'inativado'} com sucesso!`,
          'success',
        );
        this.loadPatientsWithFilters();
      },
      error: (err) => {
        console.error(`Erro ao ${acao} paciente:`, err);
        this.snackbar.show(`Erro inesperado ao ${acao} paciente.`, 'error');
      },
    });
  }

  private hydrateDraftsFromActiveFilters() {
    const f = this.activeFilters();
    this.draftStatus =
      f.ativo === true ? 'ativo' : f.ativo === false ? 'inativo' : 'todos';
    this.draftNome = f.nome ?? '';
    this.draftCpf = f.cpf ?? '';
    this.draftSexo = f.sexo ?? '';
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
