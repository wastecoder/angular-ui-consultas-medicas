import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { PacienteTable, PacienteSortField } from '../../patient.models';
import { SortDirection } from '@shared/models/pagination.model';
import { PageEvent } from '@angular/material/paginator';
import { FormattingService } from '@shared/services/formatting.service';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

export type PacienteModel = PacienteTable;

@Component({
  selector: 'app-patient-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    HasRoleDirective,
  ],
  templateUrl: './patient-table.component.html',
  styleUrl: './patient-table.component.css',
})
export class PatientTableComponent {
  @Input() pacientes: PacienteModel[] = [];

  @Input() totalElements: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 5;
  @Output() pageChange = new EventEmitter<PageEvent>();

  @Input() sortActive: PacienteSortField = 'nome';
  @Input() sortDirection: SortDirection = 'asc';
  @Output() sortChange = new EventEmitter<Sort>();

  @Output() onRequestUpdate = new EventEmitter<PacienteModel>();
  @Output() onRequestViewProfile = new EventEmitter<PacienteModel>();
  @Output() onRequestToggleAtivo = new EventEmitter<PacienteModel>();

  constructor(private readonly formatting: FormattingService) {}

  displayedColumns: string[] = [
    'nome',
    'cpf',
    'sexo',
    'dataNascimento',
    'email',
    'telefone',
    'acoes',
  ];

  update(paciente: PacienteModel) {
    this.onRequestUpdate.emit(paciente);
  }

  viewProfile(paciente: PacienteModel) {
    this.onRequestViewProfile.emit(paciente);
  }

  toggleAtivo(paciente: PacienteModel) {
    this.onRequestToggleAtivo.emit(paciente);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  onSortChange(event: Sort) {
    this.sortChange.emit(event);
  }

  formatCpf(cpf: string): string {
    return this.formatting.formatCpf(cpf);
  }

  formatTelephone(telefone: string): string {
    return this.formatting.formatTelephone(telefone);
  }
}
