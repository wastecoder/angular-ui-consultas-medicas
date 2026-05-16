import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { UsuarioTable, UsuarioSortField } from '../../user.models';
import { SortDirection } from '@shared/models/pagination.model';
import { Funcao } from '@shared/auth/role.types';
import { FUNCAO_LABEL } from '../../user.constants';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

@Component({
  selector: 'app-user-table',
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
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
})
export class UserTableComponent {
  @Input() usuarios: UsuarioTable[] = [];

  @Input() totalElements: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 5;
  @Output() pageChange = new EventEmitter<PageEvent>();

  @Input() sortActive: UsuarioSortField = 'username';
  @Input() sortDirection: SortDirection = 'asc';
  @Output() sortChange = new EventEmitter<Sort>();

  @Output() onRequestUpdate = new EventEmitter<UsuarioTable>();
  @Output() onRequestViewProfile = new EventEmitter<UsuarioTable>();
  @Output() onRequestToggleAtivo = new EventEmitter<UsuarioTable>();

  funcaoLabel = FUNCAO_LABEL;

  labelFuncao(funcao: Funcao): string {
    return FUNCAO_LABEL[funcao];
  }

  displayedColumns: string[] = [
    'username',
    'email',
    'funcao',
    'ativo',
    'acoes',
  ];

  update(usuario: UsuarioTable) {
    this.onRequestUpdate.emit(usuario);
  }

  viewProfile(usuario: UsuarioTable) {
    this.onRequestViewProfile.emit(usuario);
  }

  toggleAtivo(usuario: UsuarioTable) {
    this.onRequestToggleAtivo.emit(usuario);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  onSortChange(event: Sort) {
    this.sortChange.emit(event);
  }
}
