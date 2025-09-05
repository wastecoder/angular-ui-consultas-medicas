import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { DoctorTable } from '../../doctor.models';
import { PageEvent } from '@angular/material/paginator';
import { FormattingService } from '../../../../shared/formatting/formatting.service';

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

  constructor(private readonly formatting: FormattingService) {}

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
    return this.formatting.formatCrm(medico);
  }

  formatTelephone(telefone: string): string {
    return this.formatting.formatTelephone(telefone);
  }
}
