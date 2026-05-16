import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { UserService } from '@services/apis/user/user.service';
import { UsuarioProfile } from '@pages/users/user.models';
import { FUNCAO_LABEL } from '@pages/users/user.constants';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  usuario!: UsuarioProfile;
  loading = signal(false);

  funcaoLabel = FUNCAO_LABEL;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.userService
      .buscarPorId(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.usuario = data;
        },
        error: (err) => {
          console.error('Erro ao carregar usuário:', err);
          const mensagemErro =
            err.error?.message ?? 'Erro ao carregar usuário.';
          this.snackbar.show(mensagemErro, 'error');
          this.router.navigate(['/users']);
        },
      });
  }

  update(usuario: UsuarioProfile) {
    this.router.navigate(['/users', usuario.id, 'edit']);
  }

  async activate(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Ativar usuário',
      content: `Tem certeza que deseja ativar o usuário ${this.usuario.username}?`,
      type: 'activate',
    });

    if (confirmed) {
      this.loading.set(true);
      this.userService
        .ativar(this.usuario.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.usuario.ativo = true;
            this.snackbar.show('Usuário ativado com sucesso!', 'success');
          },
          error: (err) => {
            console.error('Erro ao ativar usuário:', err);
            this.snackbar.show('Erro inesperado ao ativar usuário.', 'error');
          },
        });
    }
  }

  async deactivate(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Inativar usuário',
      content: `Tem certeza que deseja inativar o usuário ${this.usuario.username}?`,
      type: 'deactivate',
    });

    if (confirmed) {
      this.loading.set(true);
      this.userService
        .inativar(this.usuario.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.usuario.ativo = false;
            this.snackbar.show('Usuário inativado com sucesso!', 'success');
          },
          error: (err) => {
            console.error('Erro ao inativar usuário:', err);
            this.snackbar.show(
              'Erro inesperado ao inativar usuário.',
              'error'
            );
          },
        });
    }
  }

  async delete(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir usuário',
      content: `Tem certeza que deseja excluir o usuário ${this.usuario.username}?`,
      type: 'delete',
    });

    if (confirmed) {
      this.loading.set(true);
      this.userService
        .excluir(this.usuario.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.snackbar.show('Usuário excluído com sucesso!', 'success');
            this.router.navigate(['/users']);
          },
          error: (err) => {
            console.error('Erro ao excluir usuário:', err);
            this.snackbar.show('Erro inesperado ao excluir usuário.', 'error');
          },
        });
    }
  }

  get initials(): string {
    if (!this.usuario?.username) return '';
    return this.usuario.username.slice(0, 2).toUpperCase();
  }
}
