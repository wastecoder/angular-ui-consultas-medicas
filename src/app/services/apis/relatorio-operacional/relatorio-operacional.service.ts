import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';
import {
  ConsultasPorData,
  ConsultasProximosDias,
  ConsultasPendentes,
  MedicoSemAgendamento,
} from '@pages/dashboards/operational/operational.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioOperacionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + 'relatorios/operacional';

  consultasPorData(
    page: number,
    size: number,
    data?: string
  ): Observable<PageResponse<ConsultasPorData>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);
    if (data) {
      params = params.set('data', data);
    }
    return this.http.get<PageResponse<ConsultasPorData>>(
      `${this.baseUrl}/consultas-por-data`,
      { params }
    );
  }

  consultasProximos7Dias(
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasProximosDias>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultasProximosDias>>(
      `${this.baseUrl}/consultas-proximos-7-dias`,
      { params }
    );
  }

  consultasPendentes(
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasPendentes>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultasPendentes>>(
      `${this.baseUrl}/consultas-pendentes`,
      { params }
    );
  }

  medicosSemAgendamento(
    page: number,
    size: number,
    mes?: number,
    ano?: number
  ): Observable<PageResponse<MedicoSemAgendamento>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);
    if (mes !== undefined && mes !== null) {
      params = params.set('mes', mes);
    }
    if (ano !== undefined && ano !== null) {
      params = params.set('ano', ano);
    }
    return this.http.get<PageResponse<MedicoSemAgendamento>>(
      `${this.baseUrl}/medicos-sem-agendamento`,
      { params }
    );
  }
}
