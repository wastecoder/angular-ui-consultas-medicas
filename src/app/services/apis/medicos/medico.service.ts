import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MedicoCreate,
  MedicoEdit,
  MedicoTable,
} from '../../../../app/medicos/medico.models';
// import { environment } from '../../../../environments/environments'; // Usar depois

@Injectable({
  providedIn: 'root',
})
export class MedicoService {
  private readonly medicoUrl = 'http://localhost:8080/medicos';

  constructor(private http: HttpClient) {}

  listar(): Observable<MedicoTable[]> {
    return this.http.get<MedicoTable[]>(this.medicoUrl);
  }

  buscarPorId(id: number): Observable<MedicoEdit> {
    return this.http.get<MedicoEdit>(`${this.medicoUrl}/${id}`);
  }

  cadastrar(medico: MedicoCreate): Observable<MedicoTable> {
    return this.http.post<MedicoTable>(this.medicoUrl, medico);
  }

  atualizar(id: number, medico: MedicoEdit): Observable<MedicoTable> {
    return this.http.put<MedicoTable>(`${this.medicoUrl}/${id}`, medico);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicoUrl}/${id}`);
  }

  ativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.medicoUrl}/ativar/${id}`, {});
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.medicoUrl}/inativar/${id}`, {});
  }
}
