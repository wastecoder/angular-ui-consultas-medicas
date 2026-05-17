import { StatusConsulta } from '@pages/appointments/appointment.constants';
import { PessoaResumo } from '@pages/appointments/appointment.models';

// Espelha os 5 DTOs de /relatorios/consulta/* do back.

export interface ConsultasPorStatusDto {
  agendada: number;
  cancelada: number;
  realizada: number;
}

export interface ConsultasPorMesDto {
  mes: number;
  total: number;
}

export interface ConsultasPorAnoDto {
  ano: number;
  total: number;
}

export interface ConsultasPorEspecialidadeDto {
  especialidade: string;
  total: number;
}

export interface ConsultaResumoDto {
  id: number;
  dataAtendimento: string; // 'YYYY-MM-DD'
  horarioAtendimento: string; // 'HH:mm:ss'
  status: StatusConsulta;
  medico: PessoaResumo;
  paciente: PessoaResumo;
}
