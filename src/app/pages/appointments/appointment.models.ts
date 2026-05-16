import { Sort } from '@shared/models/pagination.model';
import { StatusConsulta } from './appointment.constants';

// Resumo de pessoa retornado pelo back nas respostas de consulta
// (medico e paciente vêm aninhados como { id, nome }).
export interface PessoaResumo {
  id: number;
  nome: string;
}

// Payload de criação (POST /consultas). dataAtendimento em 'YYYY-MM-DD'
// e horarioAtendimento em 'HH:mm' para casar com LocalDate/LocalTime do Spring.
export interface ConsultaCadastroPayload {
  dataAtendimento: string;
  horarioAtendimento: string;
  duracaoEmMinutos: number;
  preco: number;
  motivo: string;
  medicoId: number;
  pacienteId: number;
}

// Payload de atualização (PUT /consultas/{id}). Mesmos campos + status.
export interface ConsultaAtualizacaoPayload extends ConsultaCadastroPayload {
  status: StatusConsulta;
}

// Linha da tabela (resposta paginada de GET /consultas).
export interface ConsultaTable {
  id: number;
  dataAtendimento: string;
  horarioAtendimento: string;
  duracaoEmMinutos: number;
  preco: number;
  motivo: string;
  status: StatusConsulta;
  medico: PessoaResumo;
  paciente: PessoaResumo;
  dataAgendamento?: string;
}

// Perfil detalhado (resposta de GET /consultas/{id}).
export interface ConsultaProfile extends ConsultaTable {}

// Filtros enviados ao back (GET /consultas).
export interface ConsultaFilter {
  dataAtendimento?: string;
  medicoId?: number;
  pacienteId?: number;
  status?: StatusConsulta;
}

export type ConsultaSortField =
  | 'dataAtendimento'
  | 'horarioAtendimento'
  | 'status'
  | 'preco';
export type ConsultaSort = Sort<ConsultaSortField>;
