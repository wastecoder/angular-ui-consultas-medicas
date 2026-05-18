import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { FormatoExportacao } from '@shared/models/formato-exportacao';
import { RelatorioExportService } from '@shared/services/relatorio-export.service';
import { environment } from '@env/environment';
import { StatusConsulta } from '@pages/appointments/appointment.constants';
import {
  ConsultasPorMesProdutividade,
  MediaConsultas,
  TaxaComparecimento,
  TempoMedioDuracao,
  TempoMedioEspera,
} from '@pages/dashboards/produtividade/produtividade.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioProdutividadeService {
  private readonly http = inject(HttpClient);
  private readonly exportService = inject(RelatorioExportService);
  private readonly baseUrl = environment.apiUrl + 'relatorios/produtividade';

  consultasPorMes(
    status: StatusConsulta,
    page: number,
    size: number
  ): Observable<PageResponse<ConsultasPorMesProdutividade>> {
    const params = new HttpParams()
      .set('status', status)
      .set('pagina', page)
      .set('tamanho', size);
    return this.http.get<PageResponse<ConsultasPorMesProdutividade>>(
      `${this.baseUrl}/consultas-por-mes`,
      { params }
    );
  }

  mediaConsultas(): Observable<MediaConsultas> {
    return this.http.get<MediaConsultas>(`${this.baseUrl}/media-consultas`);
  }

  tempoMedioDuracao(): Observable<TempoMedioDuracao> {
    return this.http.get<TempoMedioDuracao>(
      `${this.baseUrl}/tempo-medio-duracao`
    );
  }

  tempoMedioEspera(): Observable<TempoMedioEspera> {
    return this.http.get<TempoMedioEspera>(
      `${this.baseUrl}/tempo-medio-espera`
    );
  }

  taxaComparecimento(): Observable<TaxaComparecimento> {
    return this.http.get<TaxaComparecimento>(
      `${this.baseUrl}/taxa-comparecimento`
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
