import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgxMaskDirective } from 'ngx-mask';
import { SIGLAS_CRM } from '@pages/doctors/doctor.constants';
import { DoctorFilter } from '@pages/doctors/doctor.models';

@Component({
  selector: 'app-doctor-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatButtonToggleModule,
    NgxMaskDirective,
  ],
  templateUrl: './doctor-filter-dialog.component.html',
  styleUrls: ['./doctor-filter-dialog.component.css'],
})
export class DoctorFilterDialogComponent {
  filters: DoctorFilter = {
    ativo: true,
    nome: '',
    crmSigla: '',
    crmDigitos: '',
  };

  siglasCrm = SIGLAS_CRM;

  constructor(public dialogRef: MatDialogRef<DoctorFilterDialogComponent>) {
    this.filters = {
      ativo: true,
      nome: '',
      crmSigla: '',
      crmDigitos: '',
    };
  }

  applyFilters() {
    this.dialogRef.close({
      ativo: this.filters.ativo,
      nome: this.filters.nome?.trim() || undefined,
      crmSigla: this.filters.crmSigla || undefined,
      crmDigitos: this.filters.crmDigitos?.trim() || undefined,
    } as DoctorFilter);
  }
}
