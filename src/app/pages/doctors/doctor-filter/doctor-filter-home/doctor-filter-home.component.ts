import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import {
  DoctorTableComponent,
  MedicoModel,
} from '../../components/doctor-table/doctor-table.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import {
  DoctorFilter,
  DoctorSort,
  DoctorSortField,
} from '@pages/doctors/doctor.models';
import { ESPECIALIDADES, SIGLAS_CRM } from '@pages/doctors/doctor.constants';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';

type StatusOption = 'todos' | 'ativo' | 'inativo';

@Component({
  selector: 'app-doctor-filter-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    NgxMaskDirective,
    DoctorTableComponent,
  ],
  templateUrl: './doctor-filter-home.component.html',
  styleUrl: './doctor-filter-home.component.css',
})
export class DoctorFilterHomeComponent implements OnInit {
  private readonly medicoService = inject(DoctorService);
  private snackbar = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  readonly siglasCrm = SIGLAS_CRM;
  readonly especialidades = ESPECIALIDADES;

  pageResponse: PageResponse<MedicoModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  activeFilters = signal<DoctorFilter>({ ativo: true });

  sort: DoctorSort = { ordenarPor: 'nome', direcao: 'asc' };

  currentPage = 0;

  filterBarOpen = signal(false);

  // Drafts do formulário inline (preenchidos quando a barra abre)
  draftStatus: StatusOption = 'ativo';
  draftNome: string = '';
  draftCrmSigla: string = '';
  draftCrmDigitos: string = '';
  draftEspecialidade: string = '';

  chips = computed(() => {
    const filters = this.activeFilters();

    const status =
      filters.ativo === true
        ? 'Ativo'
        : filters.ativo === false
        ? 'Inativo'
        : '';

    const nome = filters.nome?.trim() ?? '';

    const sigla = filters.crmSigla;
    const digitos = filters.crmDigitos?.trim();
    const crm = sigla ? (digitos ? `${sigla} ${digitos}` : sigla) : '';

    const especialidade = filters.especialidade
      ? this.titleCase(filters.especialidade)
      : '';

    return { status, nome, crm, especialidade };
  });

  hasAnyChip = computed(() => {
    const c = this.chips();
    return Boolean(c.status || c.nome || c.crm || c.especialidade);
  });

  ngOnInit(): void {
    this.loadDoctorsWithFilters();
  }

  loadDoctorsWithFilters(
    page: number = this.currentPage,
    size: number = this.pageResponse.size
  ): void {
    this.medicoService
      .listarComFiltros(page, size, this.activeFilters(), this.sort)
      .subscribe({
        next: (data) => {
          this.pageResponse = data;
          this.currentPage = page;
        },
        error: (error) => {
          console.error('Erro ao carregar médicos:', error);
          const errorMessage =
            error.error?.message ?? 'Erro ao carregar médicos.';
          this.snackbar.show(errorMessage, 'error');
        },
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.loadDoctorsWithFilters(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as DoctorSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
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
    const sigla = this.draftCrmSigla;
    const digitos = this.draftCrmDigitos.trim();
    const especialidade = this.draftEspecialidade;

    if (digitos && !sigla) {
      this.snackbar.show(
        'Selecione uma UF para filtrar pelos dígitos do CRM.',
        'warning'
      );
      return;
    }

    const filters: DoctorFilter = {
      ativo:
        status === 'ativo' ? true : status === 'inativo' ? false : undefined,
      nome: nome || undefined,
      crmSigla: sigla || undefined,
      crmDigitos: sigla && digitos ? digitos : undefined,
      especialidade: especialidade || undefined,
    };

    this.activeFilters.set(filters);
    this.filterBarOpen.set(false);
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
  }

  clearStatus() {
    this.activeFilters.update((f) => ({ ...f, ativo: undefined }));
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
  }

  clearNome() {
    this.activeFilters.update((f) => ({ ...f, nome: undefined }));
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
  }

  clearCrm() {
    this.activeFilters.update((f) => ({
      ...f,
      crmSigla: undefined,
      crmDigitos: undefined,
    }));
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
  }

  clearEspecialidade() {
    this.activeFilters.update((f) => ({ ...f, especialidade: undefined }));
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
  }

  clearAll() {
    this.activeFilters.set({ ativo: true });
    this.draftStatus = 'ativo';
    this.draftNome = '';
    this.draftCrmSigla = '';
    this.draftCrmDigitos = '';
    this.draftEspecialidade = '';
    this.filterBarOpen.set(false);
    this.loadDoctorsWithFilters(0, this.pageResponse.size);
  }

  update(medico: MedicoModel) {
    this.router.navigate(['/doctors', medico.id, 'edit']);
  }

  viewProfile(medico: MedicoModel) {
    this.router.navigate(['/doctors', medico.id, 'profile']);
  }

  async toggleAtivo(medico: MedicoModel): Promise<void> {
    const willActivate = !medico.ativo;
    const acao = willActivate ? 'ativar' : 'inativar';

    const confirmed = await this.dialogService.confirm({
      title: `${willActivate ? 'Ativar' : 'Inativar'} médico`,
      content: `Tem certeza que deseja ${acao} o médico ${medico.nome}?`,
      type: willActivate ? 'activate' : 'deactivate',
    });

    if (!confirmed) {
      return;
    }

    const request$ = willActivate
      ? this.medicoService.ativar(medico.id)
      : this.medicoService.inativar(medico.id);

    request$.subscribe({
      next: () => {
        this.snackbar.show(
          `Médico ${willActivate ? 'ativado' : 'inativado'} com sucesso!`,
          'success',
        );
        this.loadDoctorsWithFilters();
      },
      error: (err) => {
        console.error(`Erro ao ${acao} médico:`, err);
        this.snackbar.show(`Erro inesperado ao ${acao} médico.`, 'error');
      },
    });
  }

  private hydrateDraftsFromActiveFilters() {
    const f = this.activeFilters();
    this.draftStatus =
      f.ativo === true ? 'ativo' : f.ativo === false ? 'inativo' : 'todos';
    this.draftNome = f.nome ?? '';
    this.draftCrmSigla = f.crmSigla ?? '';
    this.draftCrmDigitos = f.crmDigitos ?? '';
    this.draftEspecialidade = f.especialidade ?? '';
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
