import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { FormatoExportacao } from '@shared/models/formato-exportacao';
import { RelatorioExportService } from '@shared/services/relatorio-export.service';
import { environment } from '@env/environment';
import {
  ConsultasRealizadasPorMedico,
  FaturamentoPorMedicoRelMedico,
  MedicosComMaisConsultasNoMes,
  MedicosPorEspecialidade,
  TaxaCancelamentoPorMedico,
} from '@pages/dashboards/medico/medico.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioMedicoService {
  private readonly http = inject(HttpClient);
  private readonly exportService = inject(RelatorioExportService);
  private readonly baseUrl = environment.apiUrl + 'relatorios/medico';

  consultasRealizadas(
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasRealizadasPorMedico>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<ConsultasRealizadasPorMedico>>(
      `${this.baseUrl}/consultas-realizadas`,
      { params }
    );
  }

  maisConsultasNoMes(
    mes: number,
    ano: number,
    page: number,
    size: number
  ): Observable<PageResponse<MedicosComMaisConsultasNoMes>> {
    const params = new HttpParams()
      .set('mes', mes)
      .set('ano', ano)
      .set('pagina', page)
      .set('tamanho', size);
    return this.http.get<PageResponse<MedicosComMaisConsultasNoMes>>(
      `${this.baseUrl}/mais-consultas-no-mes`,
      { params }
    );
  }

  medicosPorEspecialidade(
    page: number,
    size: number
  ): Observable<PageResponse<MedicosPorEspecialidade>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<MedicosPorEspecialidade>>(
      `${this.baseUrl}/por-especialidade`,
      { params }
    );
  }

  taxaCancelamento(
    page: number,
    size: number
  ): Observable<PageResponse<TaxaCancelamentoPorMedico>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<TaxaCancelamentoPorMedico>>(
      `${this.baseUrl}/taxa-cancelamento`,
      { params }
    );
  }

  faturamento(
    page: number,
    size: number
  ): Observable<PageResponse<FaturamentoPorMedicoRelMedico>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<FaturamentoPorMedicoRelMedico>>(
      `${this.baseUrl}/faturamento`,
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
