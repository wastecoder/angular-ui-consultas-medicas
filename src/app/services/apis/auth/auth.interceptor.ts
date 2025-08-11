import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  // Se nao esta logado ou token expirou >>> faz logout e redireciona
  if (!auth.isLoggedIn()) {
    auth.logout();
    router.navigate(['/login']);
    return next(req);
  }

  // Se token valido, adiciona no header
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};
