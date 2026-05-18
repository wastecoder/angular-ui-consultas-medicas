import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { FormatoExportacao } from '@shared/models/formato-exportacao';
import { RelatorioExportService } from '@shared/services/relatorio-export.service';
import { environment } from '@env/environment';
import {
  ConsultaResumoDto,
  ConsultasPorAnoDto,
  ConsultasPorEspecialidadeDto,
  ConsultasPorMesDto,
  ConsultasPorStatusDto,
} from '@pages/dashboards/appointments/appointments.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioConsultaService {
  private readonly http = inject(HttpClient);
  private readonly exportService = inject(RelatorioExportService);
  private readonly baseUrl = environment.apiUrl + 'relatorios/consulta';

  consultasPorStatus(): Observable<ConsultasPorStatusDto> {
    return this.http.get<ConsultasPorStatusDto>(
      `${this.baseUrl}/consultas-por-status`
    );
  }

  porMes(
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasPorMesDto>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultasPorMesDto>>(
      `${this.baseUrl}/por-mes`,
      { params }
    );
  }

  porAno(
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasPorAnoDto>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultasPorAnoDto>>(
      `${this.baseUrl}/por-ano`,
      { params }
    );
  }

  porEspecialidade(
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasPorEspecialidadeDto>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultasPorEspecialidadeDto>>(
      `${this.baseUrl}/por-especialidade`,
      { params }
    );
  }

  porPeriodo(
    inicio: string,
    fim: string,
    page: number,
    size: number
  ): Observable<PageResponse<ConsultaResumoDto>> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim)
      .set('pagina', page)
      .set('tamanho', size);
    return this.http.get<PageResponse<ConsultaResumoDto>>(
      `${this.baseUrl}/por-periodo`,
      { params }
    );
  }

  porPaciente(
    id: number,
    page: number,
    size: number
  ): Observable<PageResponse<ConsultaResumoDto>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultaResumoDto>>(
      `${this.baseUrl}/por-paciente/${id}`,
      { params }
    );
  }

  porMedico(
    id: number,
    page: number,
    size: number
  ): Observable<PageResponse<ConsultaResumoDto>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultaResumoDto>>(
      `${this.baseUrl}/por-medico/${id}`,
      { params }
    );
  }

  baixar(
    path: string,
    formato: FormatoExportacao,
    extraParams: Record<string, string | number> = {}
  ): Observable<Blob> {
    return this.exportService.baixar(this.baseUrl, path, formato, extraParams);
  }
}
