import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UserFormComponent } from '../components/user-form/user-form.component';
import { UserService } from '@services/apis/user/user.service';
import {
  UsuarioCreatePayload,
  UsuarioUpdatePayload,
} from '@pages/users/user.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [UserFormComponent],
  templateUrl: './user-create.component.html',
})
export class UserCreateComponent {
  loading = signal(false);

  constructor(
    private userService: UserService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  cadastrar(payload: UsuarioCreatePayload | UsuarioUpdatePayload) {
    // No modo criar, o form sempre emite UsuarioCreatePayload.
    const novo = payload as UsuarioCreatePayload;

    this.loading.set(true);
    this.userService
      .cadastrar(novo)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Usuário cadastrado com sucesso!', 'success');
          this.router.navigate(['/users']);
        },
        error: (err) => {
          console.error('Erro ao cadastrar usuário', err);

          if (err.status === 409) {
            this.snackbar.show(
              err.error?.message ?? 'Usuário ou e-mail já cadastrado.',
              'warning'
            );
          } else if (err.status === 400) {
            this.snackbar.show(
              err.error?.message ?? 'Dados inválidos para cadastro.',
              'warning'
            );
          } else {
            this.snackbar.show(
              'Erro inesperado ao cadastrar usuário.',
              'error'
            );
          }
        },
      });
  }
}
