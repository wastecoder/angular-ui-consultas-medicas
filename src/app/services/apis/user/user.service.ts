import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  UsuarioCreatePayload,
  UsuarioUpdatePayload,
  UsuarioTable,
  UsuarioProfile,
  UsuarioFilter,
  UsuarioSort,
} from '@pages/users/user.models';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly usuarioUrl = environment.apiUrl + 'usuarios';

  constructor(private http: HttpClient) {}

  listar(
    page: number,
    size: number,
    sort?: UsuarioSort
  ): Observable<PageResponse<UsuarioTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<UsuarioTable>>(this.usuarioUrl, {
      params,
    });
  }

  // O back ainda não filtra server-side; mesmo assim já enviamos os params
  // para quando ele passar a suportar. A filtragem client-side fica nos
  // componentes (user-list / user-filter-home).
  listarComFiltros(
    page: number,
    size: number,
    filtros: UsuarioFilter,
    sort?: UsuarioSort
  ): Observable<PageResponse<UsuarioTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    if (filtros?.username && filtros.username.trim()) {
      params = params.set('username', filtros.username.trim());
    }

    if (filtros?.funcao) {
      params = params.set('funcao', filtros.funcao);
    }

    if (filtros?.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<UsuarioTable>>(this.usuarioUrl, {
      params,
    });
  }

  buscarPorId(id: number): Observable<UsuarioProfile> {
    return this.http.get<UsuarioProfile>(`${this.usuarioUrl}/${id}`);
  }

  cadastrar(usuario: UsuarioCreatePayload): Observable<UsuarioTable> {
    return this.http.post<UsuarioTable>(this.usuarioUrl, usuario);
  }

  atualizar(
    id: number,
    usuario: UsuarioUpdatePayload
  ): Observable<UsuarioTable> {
    return this.http.put<UsuarioTable>(`${this.usuarioUrl}/${id}`, usuario);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usuarioUrl}/${id}`);
  }

  ativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.usuarioUrl}/ativar/${id}`, {});
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.usuarioUrl}/inativar/${id}`, {});
  }
}
