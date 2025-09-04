import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { DoctorTable } from '../../doctor.models';
import { PageEvent } from '@angular/material/paginator';

export type MedicoModel = DoctorTable;

@Component({
  selector: 'app-doctor-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './doctor-table.component.html',
})
export class DoctorTableComponent {
  @Input() medicos: MedicoModel[] = [];

  @Input() totalElements: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 5;
  @Output() pageChange = new EventEmitter<PageEvent>();

  @Output() onRequestUpdate = new EventEmitter<MedicoModel>();
  @Output() onRequestViewProfile = new EventEmitter<MedicoModel>();

  displayedColumns: string[] = [
    'id',
    'nome',
    'crm',
    'especialidade',
    'email',
    'telefone',
    'acoes',
  ];

  update(medico: MedicoModel) {
    this.onRequestUpdate.emit(medico);
  }

  viewProfile(medico: MedicoModel) {
    this.onRequestViewProfile.emit(medico);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  formatCrm(medico: MedicoModel): string {
    return `CRM/${medico.crmSigla} ${medico.crmDigitos}`;
  }

  formatTelephone(telefone: string): string {
    if (telefone.length === 11) {
      return `(${telefone.substring(0, 2)}) ${telefone.substring(
        2,
        7
      )}-${telefone.substring(7)}`;
    } else if (telefone.length === 10) {
      return `(${telefone.substring(0, 2)}) ${telefone.substring(
        2,
        6
      )}-${telefone.substring(6)}`;
    } else {
      return telefone;
    }
  }
}
