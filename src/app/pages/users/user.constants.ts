import { Funcao } from '@shared/auth/role.types';

export const FUNCOES: Funcao[] = ['ADMIN', 'RECEPCIONISTA', 'MEDICO', 'PACIENTE'];

export const FUNCAO_LABEL: Record<Funcao, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  MEDICO: 'Médico',
  PACIENTE: 'Paciente',
};
