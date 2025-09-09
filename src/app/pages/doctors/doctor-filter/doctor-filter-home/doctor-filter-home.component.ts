import { Component, inject, OnInit } from '@angular/core';
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

// Tipagem dos filtros (opcional, mas recomendado)
export interface DoctorFiltro {
  nome?: string;
  crmSigla?: string;
  crmDigitos?: string;
  ativo?: boolean; // true/false/undefined
}

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
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  medicos: MedicoModel[] = [];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 5;

  // Filtros atuais (default: ativo = true)
  filtrosAtivos: DoctorFiltro = { ativo: true };

  // Getters para os chips
  get statusLabel(): string {
    const s = this.filtrosAtivos?.ativo;
    return s === true ? 'Ativo' : s === false ? 'Inativo' : 'Todos';
  }
  get nomeLabel(): string {
    return this.filtrosAtivos?.nome?.trim() || '';
  }
  get crmLabel(): string {
    const sigla = this.filtrosAtivos?.crmSigla;
    const digitos = this.filtrosAtivos?.crmDigitos?.trim();
    return sigla && digitos ? `${sigla} ${digitos}` : '';
  }

  ngOnInit(): void {
    this.carregarMedicosComFiltros(
      this.pageIndex,
      this.pageSize,
      this.filtrosAtivos
    );
  }

  carregarMedicosComFiltros(
    page: number,
    size: number,
    filtros: DoctorFiltro
  ): void {
    console.log(
      '[DEBUG] carregarMedicosComFiltros -> page, size, filtros:',
      page,
      size,
      filtros
    );

    this.medicoService.listarComFiltros(page, size, filtros).subscribe({
      next: (dados) => {
        this.medicos = dados.content;
        this.totalElements = dados.totalElements;
      },
      error: (erro) => {
        console.error('Erro ao carregar médicos:', erro);
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregarMedicosComFiltros(
      this.pageIndex,
      this.pageSize,
      this.filtrosAtivos
    );
  }

  abrirDialog() {
    const dialogRef = this.dialog.open(DoctorFilterDialogComponent, {
      width: '400px',
      data: { filtros: this.filtrosAtivos }, // pré-popula o dialog
    });

    dialogRef.afterClosed().subscribe((filtros: DoctorFiltro | undefined) => {
      if (filtros) {
        this.filtrosAtivos = filtros;
        this.pageIndex = 0;
        this.carregarMedicosComFiltros(0, this.pageSize, filtros);
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
