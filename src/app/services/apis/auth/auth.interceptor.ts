import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';

// Estado de refresh compartilhado entre requisições concorrentes.
// Reinicia a cada reload da SPA, que é o comportamento desejado.
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

function isAuthEndpoint(url: string): boolean {
  return (
    url.endsWith('/auth/login') ||
    url.endsWith('/auth/refresh') ||
    url.endsWith('/auth/logout')
  );
}

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  // Bypass das rotas de auth — login e refresh nunca recebem Bearer; logout
  // recebe Bearer mas não deve disparar refresh em caso de 401.
  if (isAuthEndpoint(req.url)) {
    const logoutToken = req.url.endsWith('/auth/logout') ? auth.getToken() : null;
    const outgoing = logoutToken ? attachToken(req, logoutToken) : req;
    return next(outgoing);
  }

  const token = auth.getToken();
  const authedReq = token ? attachToken(req, token) : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.getRefreshToken()) {
        return handle401(req, next, auth, router, snackbar);
      }
      if (error.status === 401 || error.status === 403) {
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
  snackbar: SnackbarService
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken) => next(attachToken(req, newToken)))
    );
  }

  isRefreshing = true;
  refreshSubject.next(null);

  return auth.refresh().pipe(
    switchMap((response) => {
      isRefreshing = false;
      refreshSubject.next(response.accessToken);
      return next(attachToken(req, response.accessToken));
    }),
    catchError((err) => {
      isRefreshing = false;
      refreshSubject.next(null);
      auth.clearSession();
      snackbar.show(
        'Sua sessão expirou. Faça login novamente.',
        'warning'
      );
      router.navigate(['/login']);
      return throwError(() => err);
    })
  );
}
