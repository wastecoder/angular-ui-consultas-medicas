import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { FormatoExportacao } from '@shared/models/formato-exportacao';
import { RelatorioExportService } from '@shared/services/relatorio-export.service';
import { environment } from '@env/environment';
import {
  FaturamentoMensal,
  FaturamentoPorEspecialidade,
  FaturamentoPorMedico,
  FaturamentoPorPeriodo,
  PerdaMensal,
  PerdaPorPeriodo,
  PerdasComCancelamentos,
} from '@pages/dashboards/financial/financial.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioFinanceiroService {
  private readonly http = inject(HttpClient);
  private readonly exportService = inject(RelatorioExportService);
  private readonly baseUrl = environment.apiUrl + 'relatorios/financeiro';

  faturamentoMensal(
    page: number,
    size: number
  ): Observable<PageResponse<FaturamentoMensal>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<FaturamentoMensal>>(
      `${this.baseUrl}/faturamento-mensal`,
      { params }
    );
  }

  faturamentoPorMedico(
    page: number,
    size: number
  ): Observable<PageResponse<FaturamentoPorMedico>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<FaturamentoPorMedico>>(
      `${this.baseUrl}/faturamento-por-medico`,
      { params }
    );
  }

  faturamentoPorEspecialidade(
    page: number,
    size: number
  ): Observable<PageResponse<FaturamentoPorEspecialidade>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<FaturamentoPorEspecialidade>>(
      `${this.baseUrl}/faturamento-por-especialidade`,
      { params }
    );
  }

  faturamentoPorPeriodo(
    inicio: string,
    fim: string
  ): Observable<FaturamentoPorPeriodo> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<FaturamentoPorPeriodo>(
      `${this.baseUrl}/faturamento-por-periodo`,
      { params }
    );
  }

  perdasComCancelamentos(): Observable<PerdasComCancelamentos> {
    return this.http.get<PerdasComCancelamentos>(
      `${this.baseUrl}/perdas-com-cancelamentos`
    );
  }

  perdaMensalComCancelamentos(
    page: number,
    size: number
  ): Observable<PageResponse<PerdaMensal>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<PerdaMensal>>(
      `${this.baseUrl}/perda-mensal-com-cancelamentos`,
      { params }
    );
  }

  perdaPorPeriodo(
    inicio: string,
    fim: string
  ): Observable<PerdaPorPeriodo> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<PerdaPorPeriodo>(
      `${this.baseUrl}/perda-por-periodo`,
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
