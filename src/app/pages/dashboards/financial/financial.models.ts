// Espelha os DTOs de /relatorios/financeiro/* do back.
// BigDecimal do back chega como number (ou string) — tratamos como number.

export interface FaturamentoMensal {
  ano: number;
  mes: number;
  totalFaturado: number;
}

export interface FaturamentoPorMedico {
  idMedico: number;
  nomeMedico: string;
  totalFaturado: number;
}

export interface FaturamentoPorEspecialidade {
  especialidadeMedica: string;
  totalFaturado: number;
}

export interface FaturamentoPorPeriodo {
  totalFaturado: number;
}

export interface PerdaMensal {
  ano: number;
  mes: number;
  totalPerdido: number;
}

export interface PerdaPorPeriodo {
  totalPerdido: number;
}

export interface PerdasComCancelamentos {
  totalPerdido: number;
}
