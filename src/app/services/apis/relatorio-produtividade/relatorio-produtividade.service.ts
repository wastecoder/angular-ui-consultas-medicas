import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';
import { StatusConsulta } from '@pages/appointments/appointment.constants';
import {
  ConsultasPorMesProdutividade,
  MediaConsultas,
  TaxaComparecimento,
  TempoMedioDuracao,
  TempoMedioEspera,
} from '@pages/dashboards/produtividade/produtividade.models';

export type FormatoExportacao = 'CSV' | 'PDF';

@Injectable({
  providedIn: 'root',
})
export class RelatorioProdutividadeService {
  private readonly http = inject(HttpClient);
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

  // Helper único para download em CSV/PDF; o componente cuida do download
  // do Blob retornado.
  baixar(
    path: string,
    formato: FormatoExportacao,
    extraParams: Record<string, string | number> = {}
  ): Observable<Blob> {
    let params = new HttpParams().set('formato', formato);
    for (const [chave, valor] of Object.entries(extraParams)) {
      params = params.set(chave, valor);
    }
    return this.http.get(`${this.baseUrl}/${path}`, {
      params,
      responseType: 'blob',
    });
  }
}
