import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DoctorTableComponent,
  MedicoModel,
} from '../components/doctor-table/doctor-table.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, DoctorTableComponent],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly medicoService = inject(DoctorService);
  medicos: MedicoModel[] = [];
  private readonly router = inject(Router);

  totalElements: number = 0;
  pageIndex: number = 0;
  pageSize: number = 5;

  ngOnInit(): void {
    this.carregarMedicos(0, 5);
  }

  carregarMedicos(page: number, size: number): void {
    this.medicoService.listar(page, size).subscribe({
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
    this.carregarMedicos(this.pageIndex, this.pageSize);
  }

  update(medico: MedicoModel) {
    this.router.navigate(['/doctors', medico.id, 'edit']);
  }

  viewProfile(medico: MedicoModel) {
    this.router.navigate(['/doctors', medico.id, 'profile']);
  }
}
