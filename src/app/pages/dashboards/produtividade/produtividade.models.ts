// Espelha os DTOs de /relatorios/produtividade/* do back.

export interface ConsultasPorMesProdutividade {
  ano: number;
  mes: number;
  totalConsultas: number;
}

export interface MediaConsultas {
  porDia: number;
  porSemana: number;
  porMes: number;
}

export interface TempoMedioDuracao {
  minutos: number;
}

export interface TempoMedioEspera {
  dias: number;
}

export interface TaxaComparecimento {
  percentual: number;
}
