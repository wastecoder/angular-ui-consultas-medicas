import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConsultaCadastroPayload,
  ConsultaAtualizacaoPayload,
  ConsultaTable,
  ConsultaProfile,
  ConsultaFilter,
  ConsultaSort,
} from '@pages/appointments/appointment.models';
import { StatusConsulta } from '@pages/appointments/appointment.constants';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly consultaUrl = environment.apiUrl + 'consultas';

  listar(
    page: number,
    size: number,
    sort?: ConsultaSort
  ): Observable<PageResponse<ConsultaTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<ConsultaTable>>(this.consultaUrl, {
      params,
    });
  }

  listarComFiltros(
    page: number,
    size: number,
    filtros: ConsultaFilter,
    sort?: ConsultaSort
  ): Observable<PageResponse<ConsultaTable>> {
    let params = new HttpParams().set('pagina', page).set('tamanho', size);

    if (filtros?.dataAtendimento) {
      params = params.set('dataAtendimento', filtros.dataAtendimento);
    }

    if (filtros?.medicoId !== undefined && filtros.medicoId !== null) {
      params = params.set('medicoId', filtros.medicoId);
    }

    if (filtros?.pacienteId !== undefined && filtros.pacienteId !== null) {
      params = params.set('pacienteId', filtros.pacienteId);
    }

    if (filtros?.status) {
      params = params.set('status', filtros.status);
    }

    if (sort) {
      params = params
        .set('ordenarPor', sort.ordenarPor)
        .set('direcao', sort.direcao);
    }

    return this.http.get<PageResponse<ConsultaTable>>(this.consultaUrl, {
      params,
    });
  }

  buscarPorId(id: number): Observable<ConsultaProfile> {
    return this.http.get<ConsultaProfile>(`${this.consultaUrl}/${id}`);
  }

  cadastrar(consulta: ConsultaCadastroPayload): Observable<ConsultaTable> {
    return this.http.post<ConsultaTable>(this.consultaUrl, consulta);
  }

  atualizar(
    id: number,
    consulta: ConsultaAtualizacaoPayload
  ): Observable<ConsultaTable> {
    return this.http.put<ConsultaTable>(`${this.consultaUrl}/${id}`, consulta);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.consultaUrl}/${id}`);
  }

  // Atalho para mudança de status via PUT, reaproveitando os dados atuais
  // da consulta como base do payload exigido pelo back.
  alterarStatus(
    id: number,
    novoStatus: StatusConsulta,
    base: ConsultaProfile
  ): Observable<ConsultaTable> {
    const payload: ConsultaAtualizacaoPayload = {
      dataAtendimento: base.dataAtendimento,
      horarioAtendimento: base.horarioAtendimento,
      duracaoEmMinutos: base.duracaoEmMinutos,
      preco: base.preco,
      motivo: base.motivo,
      medicoId: base.medico.id,
      pacienteId: base.paciente.id,
      status: novoStatus,
    };
    return this.atualizar(id, payload);
  }
}
