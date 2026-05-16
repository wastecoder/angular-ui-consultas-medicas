import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PacientePayload,
  PacienteTable,
  PacienteProfile,
  PacienteFilter,
  PacienteSort,
} from '@pages/patients/patient.models';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly pacienteUrl = environment.apiUrl + 'pacientes';

  constructor(private http: HttpClient) {}

  listar(
    page: number,
    size: number,
    sort?: PacienteSort
  ): Observable<PageResponse<PacienteTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<PacienteTable>>(this.pacienteUrl, {
      params,
    });
  }

  listarComFiltros(
    page: number,
    size: number,
    filtros: PacienteFilter,
    sort?: PacienteSort
  ): Observable<PageResponse<PacienteTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    // aplica prioridade do back: nome > cpf > sexo > ativo
    if (filtros?.nome && filtros.nome.trim()) {
      params = params.set('nome', filtros.nome.trim());
    }

    if (filtros?.cpf && filtros.cpf.trim()) {
      params = params.set('cpf', filtros.cpf.trim());
    }

    if (filtros?.sexo) {
      params = params.set('sexo', filtros.sexo);
    }

    if (filtros?.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<PacienteTable>>(this.pacienteUrl, {
      params,
    });
  }

  buscarPorId(id: number): Observable<PacienteProfile> {
    return this.http.get<PacienteProfile>(`${this.pacienteUrl}/${id}`);
  }

  cadastrar(paciente: PacientePayload): Observable<PacienteTable> {
    return this.http.post<PacienteTable>(this.pacienteUrl, paciente);
  }

  atualizar(
    id: number,
    paciente: PacientePayload
  ): Observable<PacienteTable> {
    return this.http.put<PacienteTable>(`${this.pacienteUrl}/${id}`, paciente);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.pacienteUrl}/${id}`);
  }

  ativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.pacienteUrl}/ativar/${id}`, {});
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.pacienteUrl}/inativar/${id}`, {});
  }
}
