import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  // Se nao esta logado, apenas deixa a requisição falhar
  if (!auth.isLoggedIn()) {
    auth.clearSession();

    return next(req).pipe(
      catchError((error) => {
        if (error.status === 401 || error.status === 403) {
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  const authReq = req.clone({
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return next(authReq);
};
