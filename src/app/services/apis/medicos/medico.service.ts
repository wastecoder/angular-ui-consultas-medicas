import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MedicoCreate,
  MedicoEdit,
  MedicoTable,
} from '../../../../app/medicos/medico.models';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class MedicoService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(): Observable<MedicoTable[]> {
    return this.http.get<MedicoTable[]>(this.API);
  }

  buscarPorId(id: number): Observable<MedicoTable> {
    return this.http.get<MedicoTable>(`${this.API}/${id}`);
  }

  cadastrar(medico: MedicoCreate): Observable<MedicoTable> {
    return this.http.post<MedicoTable>(this.API, medico);
  }

  atualizar(id: number, medico: MedicoEdit): Observable<MedicoTable> {
    return this.http.put<MedicoTable>(`${this.API}/${id}`, medico);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  ativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/ativar/${id}`, {});
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/inativar/${id}`, {});
  }
}
