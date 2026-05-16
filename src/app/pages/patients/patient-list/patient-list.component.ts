import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PatientTableComponent,
  PacienteModel,
} from '../components/patient-table/patient-table.component';
import {
  PacienteSort,
  PacienteSortField,
} from '@pages/patients/patient.models';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { PatientService } from '@services/apis/patient/patient.service';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, PatientTableComponent],
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements OnInit {
  private readonly pacienteService = inject(PatientService);
  private snackbar = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  pageResponse: PageResponse<PacienteModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  sort: PacienteSort = { ordenarPor: 'nome', direcao: 'asc' };

  currentPage = 0;

  ngOnInit(): void {
    this.loadPatients(0, 5);
  }

  loadPatients(page: number, size: number): void {
    this.pacienteService
      .listarComFiltros(page, size, { ativo: true }, this.sort)
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
    this.loadPatients(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as PacienteSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadPatients(0, this.pageResponse.size);
  }

  update(patient: PacienteModel) {
    this.router.navigate(['/patients', patient.id, 'edit']);
  }

  viewProfile(patient: PacienteModel) {
    this.router.navigate(['/patients', patient.id, 'profile']);
  }

  async toggleAtivo(patient: PacienteModel): Promise<void> {
    const willActivate = !patient.ativo;
    const acao = willActivate ? 'ativar' : 'inativar';

    const confirmed = await this.dialogService.confirm({
      title: `${willActivate ? 'Ativar' : 'Inativar'} paciente`,
      content: `Tem certeza que deseja ${acao} o paciente ${patient.nome}?`,
      type: willActivate ? 'activate' : 'deactivate',
    });

    if (!confirmed) {
      return;
    }

    const request$ = willActivate
      ? this.pacienteService.ativar(patient.id)
      : this.pacienteService.inativar(patient.id);

    request$.subscribe({
      next: () => {
        this.snackbar.show(
          `Paciente ${willActivate ? 'ativado' : 'inativado'} com sucesso!`,
          'success',
        );
        this.loadPatients(this.currentPage, this.pageResponse.size);
      },
      error: (err) => {
        console.error(`Erro ao ${acao} paciente:`, err);
        this.snackbar.show(`Erro inesperado ao ${acao} paciente.`, 'error');
      },
    });
  }
}
