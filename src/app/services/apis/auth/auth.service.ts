import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@env/environment';
import { LoginRequest, LoginResponse } from './auth.models';
import { Router } from '@angular/router';
import { Funcao, isFuncao } from '@shared/auth/role.types';

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
          if (response?.token) {
            this.saveToken(response.token, rememberMe);
            this.saveUserData(response.token, rememberMe);
            this.currentUserSubject.next(this.getUserData());
          }
        })
      );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  saveToken(token: string, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(environment.tokenKey, token);
  }

  clearSession(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
  }

  removeToken(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem('user_data');
    sessionStorage.removeItem(environment.tokenKey);
    sessionStorage.removeItem('user_data');
  }

  getToken(): string | null {
    return (
      localStorage.getItem(environment.tokenKey) ||
      sessionStorage.getItem(environment.tokenKey)
    );
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const expired = decoded.exp * 1000 < Date.now();
      if (expired) {
        this.removeToken();
        return false;
      }
      return true;
    } catch (e) {
      this.removeToken();
      return false;
    }
  }

  saveUserData(token: string, rememberMe: boolean): void {
    try {
      const decoded: any = jwtDecode(token);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user_data', JSON.stringify(decoded));
    } catch {}
  }

  getUserData(): any | null {
    const raw =
      localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
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
