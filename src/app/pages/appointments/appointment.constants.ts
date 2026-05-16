export type StatusConsulta = 'AGENDADA' | 'REALIZADA' | 'CANCELADA';

export const STATUS_CONSULTA: StatusConsulta[] = [
  'AGENDADA',
  'REALIZADA',
  'CANCELADA',
];

export const STATUS_CONSULTA_LABEL: Record<StatusConsulta, string> = {
  AGENDADA: 'Agendada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
};

export const DURACAO_MIN_MINUTOS = 10;
export const DURACAO_MAX_MINUTOS = 120;
export const DURACAO_PADRAO = 30;
export const DURACOES_DISPONIVEIS: number[] = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
];
export const MOTIVO_MAX_CHARS = 200;
