import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import {
  UserTableComponent,
} from '../../components/user-table/user-table.component';
import {
  UsuarioFilter,
  UsuarioSort,
  UsuarioSortField,
  UsuarioTable,
} from '@pages/users/user.models';
import { FUNCAO_LABEL, FUNCOES } from '@pages/users/user.constants';
import { Funcao, isFuncao } from '@shared/auth/role.types';
import { PageResponse, SortDirection } from '@shared/models/pagination.model';
import { UserService } from '@services/apis/user/user.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';

type StatusOption = 'todos' | 'ativo' | 'inativo';

@Component({
  selector: 'app-user-filter-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    UserTableComponent,
  ],
  templateUrl: './user-filter-home.component.html',
  styleUrl: './user-filter-home.component.css',
})
export class UserFilterHomeComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  readonly funcoes = FUNCOES;
  readonly funcaoLabel = FUNCAO_LABEL;

  pageResponse: PageResponse<UsuarioTable> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 5,
    number: 0,
  };

  activeFilters = signal<UsuarioFilter>({ ativo: true });

  sort: UsuarioSort = { ordenarPor: 'username', direcao: 'asc' };

  currentPage = 0;

  filterBarOpen = signal(false);

  draftStatus: StatusOption = 'ativo';
  draftUsername: string = '';
  draftFuncao: Funcao | '' = '';

  chips = computed(() => {
    const filters = this.activeFilters();
    const status =
      filters.ativo === true
        ? 'Ativo'
        : filters.ativo === false
        ? 'Inativo'
        : '';
    const username = filters.username?.trim() ?? '';
    const funcao = filters.funcao ? this.funcaoLabel[filters.funcao] : '';
    return { status, username, funcao };
  });

  hasAnyChip = computed(() => {
    const c = this.chips();
    return Boolean(c.status || c.username || c.funcao);
  });

  ngOnInit(): void {
    this.loadUsersWithFilters();
  }

  loadUsersWithFilters(
    page: number = this.currentPage,
    size: number = this.pageResponse.size
  ): void {
    this.userService
      .listarComFiltros(page, size, this.activeFilters(), this.sort)
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
    this.loadUsersWithFilters(event.pageIndex, event.pageSize);
  }

  onSortChange(event: Sort) {
    this.sort = {
      ordenarPor: event.active as UsuarioSortField,
      direcao: event.direction as SortDirection,
    };
    this.loadUsersWithFilters(0, this.pageResponse.size);
  }

  toggleFilterBar() {
    if (!this.filterBarOpen()) {
      this.hydrateDraftsFromActiveFilters();
    }
    this.filterBarOpen.update((open) => !open);
  }

  setDraftStatus(value: StatusOption) {
    this.draftStatus = value;
  }

  applyDraftFilters() {
    const status = this.draftStatus;
    const username = this.draftUsername.trim();
    const funcao = this.draftFuncao && isFuncao(this.draftFuncao)
      ? this.draftFuncao
      : undefined;

    const filters: UsuarioFilter = {
      ativo:
        status === 'ativo' ? true : status === 'inativo' ? false : undefined,
      username: username || undefined,
      funcao,
    };

    this.activeFilters.set(filters);
    this.filterBarOpen.set(false);
    this.loadUsersWithFilters(0, this.pageResponse.size);
  }

  clearStatus() {
    this.activeFilters.update((f) => ({ ...f, ativo: undefined }));
    this.loadUsersWithFilters(0, this.pageResponse.size);
  }

  clearUsername() {
    this.activeFilters.update((f) => ({ ...f, username: undefined }));
    this.loadUsersWithFilters(0, this.pageResponse.size);
  }

  clearFuncao() {
    this.activeFilters.update((f) => ({ ...f, funcao: undefined }));
    this.loadUsersWithFilters(0, this.pageResponse.size);
  }

  clearAll() {
    this.activeFilters.set({ ativo: true });
    this.draftStatus = 'ativo';
    this.draftUsername = '';
    this.draftFuncao = '';
    this.filterBarOpen.set(false);
    this.loadUsersWithFilters(0, this.pageResponse.size);
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
        this.loadUsersWithFilters();
      },
      error: (err) => {
        console.error(`Erro ao ${acao} usuário:`, err);
        this.snackbar.show(`Erro inesperado ao ${acao} usuário.`, 'error');
      },
    });
  }

  private hydrateDraftsFromActiveFilters() {
    const f = this.activeFilters();
    this.draftStatus =
      f.ativo === true ? 'ativo' : f.ativo === false ? 'inativo' : 'todos';
    this.draftUsername = f.username ?? '';
    this.draftFuncao = f.funcao ?? '';
  }
}
