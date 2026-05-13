import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '@services/apis/auth/auth.service';

// Verifica se o usuário está logado;
// Se o access ainda for válido, libera direto.
// Se o access expirou mas há refresh, tenta renovar antes de redirecionar.
// Caso contrário, manda para /login.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAccessTokenValid()) {
    return true;
  }

  if (authService.getRefreshToken()) {
    return authService.refresh().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  router.navigate(['/login']);
  return false;
};
