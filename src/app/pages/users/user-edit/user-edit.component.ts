import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UserFormComponent } from '../components/user-form/user-form.component';
import { UserService } from '@services/apis/user/user.service';
import {
  UsuarioCreatePayload,
  UsuarioProfile,
  UsuarioUpdatePayload,
} from '@pages/users/user.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [UserFormComponent],
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit {
  usuarioId!: number;
  usuario: UsuarioProfile | null = null;
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.usuarioId = Number(idParam);

    if (!this.usuarioId) {
      this.snackbar.show('ID de usuário inválido.', 'error');
      return;
    }

    this.loading.set(true);
    this.userService
      .buscarPorId(this.usuarioId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dados: UsuarioProfile) => {
          this.usuario = dados;
        },
        error: (err) => {
          console.error('Erro ao carregar usuário:', err);
          const errorMessage =
            err.error?.message ?? 'Erro ao carregar dados do usuário.';
          this.snackbar.show(errorMessage, 'error');
          this.router.navigate(['/users']);
        },
      });
  }

  onSalvar(payload: UsuarioCreatePayload | UsuarioUpdatePayload) {
    // No modo editar, o form sempre emite UsuarioUpdatePayload.
    const atualizacao = payload as UsuarioUpdatePayload;

    this.loading.set(true);
    this.userService
      .atualizar(this.usuarioId, atualizacao)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Usuário atualizado com sucesso!', 'success');
          this.router.navigate([`/users/${this.usuarioId}/profile`]);
        },
        error: (err) => {
          console.error('Erro ao atualizar usuário:', err);

          if (err.status === 409) {
            this.snackbar.show(
              err.error?.message ?? 'Usuário ou e-mail já cadastrado.',
              'warning'
            );
          } else if (err.status === 400) {
            this.snackbar.show(
              err.error?.message ?? 'Dados inválidos para atualização.',
              'warning'
            );
          } else {
            this.snackbar.show(
              'Erro inesperado ao atualizar usuário.',
              'error'
            );
          }
        },
      });
  }
}
