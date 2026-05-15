import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { DoctorTable, DoctorSortField } from '../../doctor.models';
import { SortDirection } from '@shared/models/pagination.model';
import { PageEvent } from '@angular/material/paginator';
import { FormattingService } from '@shared/services/formatting.service';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

export type MedicoModel = DoctorTable;

@Component({
  selector: 'app-doctor-table',
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
  templateUrl: './doctor-table.component.html',
  styleUrl: './doctor-table.component.css',
})
export class DoctorTableComponent {
  @Input() medicos: MedicoModel[] = [];

  @Input() totalElements: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 5;
  @Output() pageChange = new EventEmitter<PageEvent>();

  @Input() sortActive: DoctorSortField = 'nome';
  @Input() sortDirection: SortDirection = 'asc';
  @Output() sortChange = new EventEmitter<Sort>();

  @Output() onRequestUpdate = new EventEmitter<MedicoModel>();
  @Output() onRequestViewProfile = new EventEmitter<MedicoModel>();
  @Output() onRequestToggleAtivo = new EventEmitter<MedicoModel>();

  constructor(private readonly formatting: FormattingService) {}

  displayedColumns: string[] = [
    'nome',
    'especialidade',
    'crm',
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

  toggleAtivo(medico: MedicoModel) {
    this.onRequestToggleAtivo.emit(medico);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  onSortChange(event: Sort) {
    this.sortChange.emit(event);
  }

  formatCrm(medico: MedicoModel): string {
    return this.formatting.formatCrm(medico);
  }

  formatTelephone(telefone: string): string {
    return this.formatting.formatTelephone(telefone);
  }
}
