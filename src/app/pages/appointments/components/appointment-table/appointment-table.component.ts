import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import {
  ConsultaSortField,
  ConsultaTable,
} from '@pages/appointments/appointment.models';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { SortDirection } from '@shared/models/pagination.model';

export type ConsultaModel = ConsultaTable;

@Component({
  selector: 'app-appointment-table',
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
  ],
  templateUrl: './appointment-table.component.html',
  styleUrl: './appointment-table.component.css',
})
export class AppointmentTableComponent {
  @Input() consultas: ConsultaModel[] = [];

  @Input() totalElements = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 5;
  @Output() pageChange = new EventEmitter<PageEvent>();

  @Input() sortActive: ConsultaSortField = 'dataAtendimento';
  @Input() sortDirection: SortDirection = 'asc';
  @Output() sortChange = new EventEmitter<Sort>();

  @Output() onRequestUpdate = new EventEmitter<ConsultaModel>();
  @Output() onRequestViewProfile = new EventEmitter<ConsultaModel>();

  displayedColumns: string[] = [
    'dataAtendimento',
    'horarioAtendimento',
    'medico',
    'paciente',
    'status',
    'preco',
    'duracaoEmMinutos',
    'acoes',
  ];

  update(consulta: ConsultaModel) {
    this.onRequestUpdate.emit(consulta);
  }

  viewProfile(consulta: ConsultaModel) {
    this.onRequestViewProfile.emit(consulta);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  onSortChange(event: Sort) {
    this.sortChange.emit(event);
  }

  statusLabel(status: StatusConsulta): string {
    return STATUS_CONSULTA_LABEL[status];
  }

  // 'HH:mm:ss' do back vira 'HH:mm' para exibição.
  formatHora(hora: string): string {
    return hora?.length >= 5 ? hora.substring(0, 5) : hora ?? '';
  }

  formatPreco(preco: number): string {
    return Number(preco ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
