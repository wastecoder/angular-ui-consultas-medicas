import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@env/environment';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  ResetPasswordRequest,
  SignupRequest,
} from './auth.models';
import { Router } from '@angular/router';
import { Funcao, isFuncao } from '@shared/auth/role.types';

const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  constructor(private router: Router) {}

  private currentUserSubject = new BehaviorSubject<any | null>(
    this.getUserData()
  );
  currentUser$ = this.currentUserSubject.asObservable();

  login(
    credentials: LoginRequest,
    rememberMe: boolean = false
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response?.accessToken && response?.refreshToken) {
            this.saveTokens(response, rememberMe);
            this.currentUserSubject.next(this.getUserData());
          }
        })
      );
  }

  signup(payload: SignupRequest, rememberMe: boolean = true): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/signup`, payload)
      .pipe(
        tap((response) => {
          if (response?.accessToken && response?.refreshToken) {
            this.saveTokens(response, rememberMe);
            this.currentUserSubject.next(this.getUserData());
          }
        })
      );
  }

  forgotPassword(email: string): Observable<void> {
    const body: ForgotPasswordRequest = { email };
    return this.http.post<void>(
      `${environment.apiUrl}auth/forgot-password`,
      body
    );
  }

  resetPassword(token: string, novaSenha: string): Observable<void> {
    const body: ResetPasswordRequest = { token, novaSenha };
    return this.http.post<void>(
      `${environment.apiUrl}auth/reset-password`,
      body
    );
  }

  refresh(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Sem refresh token'));
    }

    const body: RefreshRequest = { refreshToken };
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/refresh`, body)
      .pipe(
        tap((response) => {
          if (response?.accessToken && response?.refreshToken) {
            const storage = this.getActiveStorage();
            this.saveTokensToStorage(response, storage);
            this.currentUserSubject.next(this.getUserData());
          }
        }),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        })
      );
  }

  logoutRemote(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const finalizeLocal = () => {
      this.clearSession();
      this.router.navigate(['/login']);
    };

    if (!refreshToken) {
      finalizeLocal();
      return new Observable<void>((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }

    const body: LogoutRequest = { refreshToken };
    return this.http
      .post<void>(`${environment.apiUrl}auth/logout`, body)
      .pipe(
        catchError(() => {
          return new Observable<void>((subscriber) => {
            subscriber.next();
            subscriber.complete();
          });
        }),
        finalize(finalizeLocal)
      );
  }

  clearSession(): void {
    this.removeTokens();
    this.currentUserSubject.next(null);
  }

  removeTokens(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    sessionStorage.removeItem(environment.tokenKey);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_DATA_KEY);
  }

  getToken(): string | null {
    return (
      localStorage.getItem(environment.tokenKey) ||
      sessionStorage.getItem(environment.tokenKey)
    );
  }

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  }

  isLoggedIn(): boolean {
    if (this.isAccessTokenValid()) return true;
    return !!this.getRefreshToken();
  }

  isAccessTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private saveTokens(response: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    this.saveTokensToStorage(response, storage);
  }

  private saveTokensToStorage(
    response: LoginResponse,
    storage: Storage
  ): void {
    storage.setItem(environment.tokenKey, response.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    try {
      const decoded: any = jwtDecode(response.accessToken);
      storage.setItem(USER_DATA_KEY, JSON.stringify(decoded));
    } catch {}
  }

  private getActiveStorage(): Storage {
    return localStorage.getItem(REFRESH_TOKEN_KEY) !== null
      ? localStorage
      : sessionStorage;
  }

  getUserData(): any | null {
    const raw =
      localStorage.getItem(USER_DATA_KEY) ||
      sessionStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getRoles(): Funcao[] {
    const data = this.getUserData();
    const raw = data?.scope;
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : String(raw).split(/\s+/);
    return list
      .map((r: string) => r.replace(/^ROLE_/, ''))
      .filter(isFuncao);
  }

  hasRole(role: Funcao): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(roles: Funcao[]): boolean {
    const userRoles = this.getRoles();
    return roles.some((r) => userRoles.includes(r));
  }
}
