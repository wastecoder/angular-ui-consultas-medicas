import { StatusConsulta } from '@pages/appointments/appointment.constants';

// Espelha os 4 DTOs de /relatorios/operacional/* do back.

export interface ConsultasPorData {
  idConsulta: number;
  horarioConsulta: string; // 'HH:mm:ss' (LocalTime)
  nomeMedico: string;
  nomePaciente: string;
  statusConsulta: StatusConsulta;
}

export interface ConsultasProximosDias {
  idConsulta: number;
  dataConsulta: string; // 'YYYY-MM-DD' (LocalDate)
  nomeMedico: string;
  nomePaciente: string;
  statusConsulta: StatusConsulta;
}

export interface ConsultasPendentes {
  idConsulta: number;
  dataConsulta: string;
  nomeMedico: string;
  nomePaciente: string;
}

export interface MedicoSemAgendamento {
  idMedico: number;
  nomeMedico: string;
  especialidadeMedica: string;
}
