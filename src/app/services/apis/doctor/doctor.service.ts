import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateDoctor,
  EditDoctor,
  DoctorTable,
  PageResponse,
  DoctorProfile,
} from '@pages/doctors/doctor.models';
import { environment } from '@env/environments';
import { DoctorFilter } from '@pages/doctors/doctor.models';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly medicoUrl = environment.apiUrl + 'medicos';

  constructor(private http: HttpClient) {}

  listar(page: number, size: number): Observable<PageResponse<DoctorTable>> {
    return this.http.get<PageResponse<DoctorTable>>(
      `${this.medicoUrl}?pagina=${page}&tamanho=${size}`
    );
  }

  listarComFiltros(
    page: number,
    size: number,
    filtros: DoctorFilter
  ): Observable<PageResponse<DoctorTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    // aplica prioridade do back
    if (filtros?.nome && filtros.nome.trim()) {
      params = params.set('nome', filtros.nome.trim());
    }

    if (filtros?.crmSigla && filtros?.crmDigitos && filtros.crmDigitos.trim()) {
      params = params
        .set('crmSigla', filtros.crmSigla)
        .set('crmDigitos', filtros.crmDigitos.trim());
    }

    if (filtros?.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }

    return this.http.get<PageResponse<DoctorTable>>(this.medicoUrl, { params });
  }

  buscarPorId(id: number): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.medicoUrl}/${id}`);
  }

  cadastrar(medico: CreateDoctor): Observable<DoctorTable> {
    return this.http.post<DoctorTable>(this.medicoUrl, medico);
  }

  atualizar(id: number, medico: EditDoctor): Observable<DoctorTable> {
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
