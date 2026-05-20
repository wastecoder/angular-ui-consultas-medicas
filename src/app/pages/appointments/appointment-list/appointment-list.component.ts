import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  AppointmentTableComponent,
  ConsultaModel,
} from '../components/appointment-table/appointment-table.component';
import {
  ConsultaSort,
  ConsultaSortField,
} from '@pages/appointments/appointment.models';
import { AppointmentService } from '@services/apis/appointment/appointment.service';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AuthService } from '@services/apis/auth/auth.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, AppointmentTableComponent],
  templateUrl: './appointment-list.component.html',
})
export class AppointmentListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  // Médico (sem perfil de gestão) acessa a lista apenas para leitura:
  // o back já restringe os resultados às consultas dele.
  readonly somenteLeitura =
    this.auth.hasRole('MEDICO') &&
    !this.auth.hasRole('ADMIN') &&
    !this.auth.hasRole('RECEPCIONISTA');

  pageResponse: PageResponse<ConsultaModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  sort: ConsultaSort = { ordenarPor: 'horarioAtendimento', direcao: 'asc' };

  currentPage = 0;
  hoje = this.toIsoDateLocal(new Date());
  hojeFormatado = this.formatHojeBR();

  ngOnInit(): void {
    this.loadAppointments(0, 5);
  }

  loadAppointments(page: number, size: number): void {
    this.appointmentService
      .listarComFiltros(page, size, { dataAtendimento: this.hoje }, this.sort)
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
    this.loadAppointments(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as ConsultaSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadAppointments(0, this.pageResponse.size);
  }

  update(consulta: ConsultaModel) {
    this.router.navigate(['/appointments', consulta.id, 'edit']);
  }

  viewProfile(consulta: ConsultaModel) {
    this.router.navigate(['/appointments', consulta.id, 'profile']);
  }

  irParaCadastro() {
    this.router.navigate(['/appointments/create']);
  }

  irParaFiltros() {
    this.router.navigate(['/appointments/filter']);
  }

  private toIsoDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatHojeBR(): string {
    const d = new Date();
    return d.toLocaleDateString('pt-BR');
  }
}
