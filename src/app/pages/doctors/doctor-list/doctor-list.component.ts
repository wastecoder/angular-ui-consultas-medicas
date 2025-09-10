import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DoctorTableComponent,
  MedicoModel,
} from '../components/doctor-table/doctor-table.component';
import { PageResponse } from '@pages/doctors/doctor.models';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, DoctorTableComponent],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly medicoService = inject(DoctorService);
  private snackbar = inject(SnackbarService);
  private readonly router = inject(Router);

  pageResponse: PageResponse<MedicoModel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  ngOnInit(): void {
    this.loadDoctors(0, 5);
  }

  loadDoctors(page: number, size: number): void {
    this.medicoService.listar(page, size).subscribe({
      next: (data) => {
        this.pageResponse = data;
      },
      error: (error) => {
        console.error('Erro ao carregar médicos:', error);
        const errorMessage =
          error.error?.message ?? 'Erro ao carregar médicos.';
        this.snackbar.show(errorMessage, 'error');
        this.router.navigate(['/doctors']);
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.loadDoctors(event.pageIndex, event.pageSize);
  }

  update(doctor: MedicoModel) {
    this.router.navigate(['/doctors', doctor.id, 'edit']);
  }

  viewProfile(doctor: MedicoModel) {
    this.router.navigate(['/doctors', doctor.id, 'profile']);
  }
}
