import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { UserTableComponent } from '../components/user-table/user-table.component';
import {
  UsuarioSort,
  UsuarioSortField,
  UsuarioTable,
} from '@pages/users/user.models';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { UserService } from '@services/apis/user/user.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, UserTableComponent],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  pageResponse: PageResponse<UsuarioTable> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  sort: UsuarioSort = { ordenarPor: 'username', direcao: 'asc' };
  currentPage = 0;

  ngOnInit(): void {
    this.loadUsers(0, 5);
  }

  loadUsers(page: number, size: number): void {
    this.userService
      .listarComFiltros(page, size, { ativo: true }, this.sort)
      .subscribe({
        next: (data) => {
          this.pageResponse = data;
          this.currentPage = page;
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          const errorMessage =
            error.error?.message ?? 'Erro ao carregar usuários.';
          this.snackbar.show(errorMessage, 'error');
        },
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.loadUsers(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as UsuarioSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadUsers(0, this.pageResponse.size);
  }

  update(usuario: UsuarioTable) {
    this.router.navigate(['/users', usuario.id, 'edit']);
  }

  viewProfile(usuario: UsuarioTable) {
    this.router.navigate(['/users', usuario.id, 'profile']);
  }

  async toggleAtivo(usuario: UsuarioTable): Promise<void> {
    const willActivate = !usuario.ativo;
    const acao = willActivate ? 'ativar' : 'inativar';

    const confirmed = await this.dialogService.confirm({
      title: `${willActivate ? 'Ativar' : 'Inativar'} usuário`,
      content: `Tem certeza que deseja ${acao} o usuário ${usuario.username}?`,
      type: willActivate ? 'activate' : 'deactivate',
    });

    if (!confirmed) return;

    const request$ = willActivate
      ? this.userService.ativar(usuario.id)
      : this.userService.inativar(usuario.id);

    request$.subscribe({
      next: () => {
        this.snackbar.show(
          `Usuário ${willActivate ? 'ativado' : 'inativado'} com sucesso!`,
          'success'
        );
        this.loadUsers(this.currentPage, this.pageResponse.size);
      },
      error: (err) => {
        console.error(`Erro ao ${acao} usuário:`, err);
        this.snackbar.show(`Erro inesperado ao ${acao} usuário.`, 'error');
      },
    });
  }
}
