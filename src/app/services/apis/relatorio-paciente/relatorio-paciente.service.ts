import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';
import {
  CancelamentosPorPaciente,
  DistribuicaoPacientesPorFaixaEtaria,
  DistribuicaoPacientesPorSexo,
  HistoricoConsultaPaciente,
  PacientesComMaisConsultas,
} from '@pages/dashboards/paciente/paciente.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioPacienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + 'relatorios/paciente';

  historico(
    idPaciente: number,
    page: number,
    size: number
  ): Observable<PageResponse<HistoricoConsultaPaciente>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<HistoricoConsultaPaciente>>(
      `${this.baseUrl}/historico/${idPaciente}`,
      { params }
    );
  }

  cancelamentos(
    page: number,
    size: number
  ): Observable<PageResponse<CancelamentosPorPaciente>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<CancelamentosPorPaciente>>(
      `${this.baseUrl}/cancelamentos`,
      { params }
    );
  }

  maisConsultas(
    inicio: string,
    fim: string,
    page: number,
    size: number
  ): Observable<PageResponse<PacientesComMaisConsultas>> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim)
      .set('pagina', page)
      .set('tamanho', size);
    return this.http.get<PageResponse<PacientesComMaisConsultas>>(
      `${this.baseUrl}/mais-consultas`,
      { params }
    );
  }

  distribuicaoPorSexo(
    page: number,
    size: number
  ): Observable<PageResponse<DistribuicaoPacientesPorSexo>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<DistribuicaoPacientesPorSexo>>(
      `${this.baseUrl}/distribuicao-sexo`,
      { params }
    );
  }

  distribuicaoPorFaixaEtaria(
    page: number,
    size: number
  ): Observable<PageResponse<DistribuicaoPacientesPorFaixaEtaria>> {
    const params = new HttpParams().set('pagina', page).set('tamanho', size);
    return this.http.get<PageResponse<DistribuicaoPacientesPorFaixaEtaria>>(
      `${this.baseUrl}/distribuicao-faixa-etaria`,
      { params }
    );
  }
}
