import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { DoctorFilterDialogComponent } from '../components/doctor-filter-dialog/doctor-filter-dialog.component';
import {
  DoctorTableComponent,
  MedicoModel,
} from '../../components/doctor-table/doctor-table.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { DoctorFilter, PageResponse } from '@pages/doctors/doctor.models';
import { FormattingService } from '@shared/services/formatting.service';

@Component({
  selector: 'app-doctor-filter-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatChipsModule,
    DoctorTableComponent,
  ],
  templateUrl: './doctor-filter-home.component.html',
})
export class DoctorFilterHomeComponent implements OnInit {
  private readonly medicoService = inject(DoctorService);
  private formattingService = inject(FormattingService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  pageResponse: PageResponse<MedicoModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  activeFilters = signal<DoctorFilter>({ ativo: true });

  filterLabels = computed(() => {
    const filters = this.activeFilters();

    const nome = filters.nome?.trim();
    const crmPreenchido = Boolean(
      filters.crmSigla && filters.crmDigitos?.trim()
    );

    // Prioridade 1: ativo + nome
    if (nome) {
      return {
        status: filters.ativo ? 'Ativo' : 'Inativo',
        nome,
      };
    }

    // Prioridade 2: CRM completo
    if (crmPreenchido) {
      return {
        crm: this.formattingService.formatCrm({
          crmSigla: filters.crmSigla!,
          crmDigitos: filters.crmDigitos!.trim(),
        }),
      };
    }

    // Prioridade 3: apenas ativo
    return {
      status: filters.ativo ? 'Ativo' : 'Inativo',
    };
  });

  ngOnInit(): void {
    this.carregarMedicosComFiltros();
  }

  carregarMedicosComFiltros(
    page: number = this.pageResponse.number,
    size: number = this.pageResponse.size
  ): void {
    this.medicoService
      .listarComFiltros(page, size, this.activeFilters())
      .subscribe({
        next: (data) => {
          this.pageResponse = data;
        },
        error: (erro) => {
          console.error('Erro ao carregar médicos:', erro);
        },
      });
  }

  onPageChange(event: PageEvent) {
    this.carregarMedicosComFiltros(event.pageIndex, event.pageSize);
  }

  openDialog() {
    const dialogRef = this.dialog.open(DoctorFilterDialogComponent, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((filtros: DoctorFilter | undefined) => {
      if (filtros) {
        this.activeFilters.set(filtros);
        this.carregarMedicosComFiltros(0, this.pageResponse.size);
      }
    });
  }

  update(medico: MedicoModel) {
    this.router.navigate(['/doctors', medico.id, 'edit']);
  }

  viewProfile(medico: MedicoModel) {
    this.router.navigate(['/doctors', medico.id, 'profile']);
  }
}
