// Espelha os DTOs de /relatorios/paciente/* do back.

import { StatusConsulta } from '@pages/appointments/appointment.constants';
import { PessoaResumo } from '@pages/appointments/appointment.models';

export type Sexo = 'MASCULINO' | 'FEMININO' | 'OUTRO';

export interface HistoricoConsultaPaciente {
  idConsulta: number;
  dataAtendimento: string;
  horarioAtendimento: string;
  status: StatusConsulta;
  medico: PessoaResumo;
}

export interface CancelamentosPorPaciente {
  idPaciente: number;
  nomePaciente: string;
  totalCancelamentos: number;
}

export interface PacientesComMaisConsultas {
  idPaciente: number;
  nomePaciente: string;
  totalConsultas: number;
}

export interface DistribuicaoPacientesPorSexo {
  sexo: Sexo;
  totalPacientes: number;
}

export interface DistribuicaoPacientesPorFaixaEtaria {
  faixaEtaria: string;
  totalPacientes: number;
}
