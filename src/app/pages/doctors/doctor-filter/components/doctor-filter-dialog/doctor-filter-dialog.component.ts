import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

export interface DoctorFiltro {
  nome?: string;
  crmSigla?: string;
  crmDigitos?: string;
  ativo?: boolean;
}

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
  ],
  templateUrl: './doctor-filter-dialog.component.html',
  styleUrls: ['./doctor-filter-dialog.component.css'],
})
export class DoctorFilterDialogComponent {
  ativo: boolean | undefined = true;
  nome = '';
  crmSigla = '';
  crmDigitos = '';

  constructor(
    public dialogRef: MatDialogRef<DoctorFilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { filtros?: DoctorFiltro } | null
  ) {
    const f = data?.filtros;
    if (f) {
      this.ativo = f.ativo ?? this.ativo;
      this.nome = f.nome ?? '';
      this.crmSigla = f.crmSigla ?? '';
      this.crmDigitos = f.crmDigitos ?? '';
    }
  }

  aplicarFiltros() {
    this.dialogRef.close({
      ativo: this.ativo,
      nome: this.nome?.trim() || undefined,
      crmSigla: this.crmSigla || undefined,
      crmDigitos: this.crmDigitos?.trim() || undefined,
    } as DoctorFiltro);
  }
}
