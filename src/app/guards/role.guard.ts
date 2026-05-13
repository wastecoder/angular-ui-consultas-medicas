import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@services/apis/auth/auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Funcao } from '@shared/auth/role.types';

// Verifica se o usuário possui ao menos uma das funções permitidas.
// Se não, redireciona para a Home e exibe snackbar de aviso.
export const roleGuard = (roles: Funcao[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  if (auth.hasAnyRole(roles)) {
    return true;
  }

  snackbar.show('Você não tem permissão para acessar esta página.', 'warning');
  router.navigate(['/']);
  return false;
};
