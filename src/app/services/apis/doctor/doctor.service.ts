import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DoctorPayload,
  DoctorTable,
  DoctorProfile,
  DoctorFilter,
  DoctorSort,
} from '@pages/doctors/doctor.models';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly medicoUrl = environment.apiUrl + 'medicos';

  constructor(private http: HttpClient) {}

  listar(
    page: number,
    size: number,
    sort?: DoctorSort
  ): Observable<PageResponse<DoctorTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<DoctorTable>>(this.medicoUrl, { params });
  }

  listarComFiltros(
    page: number,
    size: number,
    filtros: DoctorFilter,
    sort?: DoctorSort
  ): Observable<PageResponse<DoctorTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    // aplica prioridade do back
    if (filtros?.nome && filtros.nome.trim()) {
      params = params.set('nome', filtros.nome.trim());
    }

    if (filtros?.crmSigla) {
      params = params.set('crmSigla', filtros.crmSigla);
      if (filtros?.crmDigitos && filtros.crmDigitos.trim()) {
        params = params.set('crmDigitos', filtros.crmDigitos.trim());
      }
    }

    if (filtros?.especialidade) {
      params = params.set('especialidade', filtros.especialidade);
    }

    if (filtros?.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<DoctorTable>>(this.medicoUrl, { params });
  }

  buscarPorId(id: number): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.medicoUrl}/${id}`);
  }

  cadastrar(medico: DoctorPayload): Observable<DoctorTable> {
    return this.http.post<DoctorTable>(this.medicoUrl, medico);
  }

  atualizar(id: number, medico: DoctorPayload): Observable<DoctorTable> {
    return this.http.put<DoctorTable>(`${this.medicoUrl}/${id}`, medico);
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
