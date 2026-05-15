import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DoctorTableComponent,
  MedicoModel,
} from '../components/doctor-table/doctor-table.component';
import { DoctorSort, DoctorSortField } from '@pages/doctors/doctor.models';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, DoctorTableComponent],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly medicoService = inject(DoctorService);
  private snackbar = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  pageResponse: PageResponse<MedicoModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  sort: DoctorSort = { ordenarPor: 'nome', direcao: 'asc' };

  currentPage = 0;

  ngOnInit(): void {
    this.loadDoctors(0, 5);
  }

  loadDoctors(page: number, size: number): void {
    this.medicoService
      .listarComFiltros(page, size, { ativo: true }, this.sort)
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
    this.loadDoctors(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as DoctorSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadDoctors(0, this.pageResponse.size);
  }

  update(doctor: MedicoModel) {
    this.router.navigate(['/doctors', doctor.id, 'edit']);
  }

  viewProfile(doctor: MedicoModel) {
    this.router.navigate(['/doctors', doctor.id, 'profile']);
  }

  async toggleAtivo(doctor: MedicoModel): Promise<void> {
    const willActivate = !doctor.ativo;
    const acao = willActivate ? 'ativar' : 'inativar';

    const confirmed = await this.dialogService.confirm({
      title: `${willActivate ? 'Ativar' : 'Inativar'} médico`,
      content: `Tem certeza que deseja ${acao} o médico ${doctor.nome}?`,
      type: willActivate ? 'activate' : 'deactivate',
    });

    if (!confirmed) {
      return;
    }

    const request$ = willActivate
      ? this.medicoService.ativar(doctor.id)
      : this.medicoService.inativar(doctor.id);

    request$.subscribe({
      next: () => {
        this.snackbar.show(
          `Médico ${willActivate ? 'ativado' : 'inativado'} com sucesso!`,
          'success',
        );
        this.loadDoctors(this.currentPage, this.pageResponse.size);
      },
      error: (err) => {
        console.error(`Erro ao ${acao} médico:`, err);
        this.snackbar.show(`Erro inesperado ao ${acao} médico.`, 'error');
      },
    });
  }
}
