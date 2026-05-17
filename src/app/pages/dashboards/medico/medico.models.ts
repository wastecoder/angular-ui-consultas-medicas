// Espelha os DTOs de /relatorios/medico/* do back.

export interface ConsultasRealizadasPorMedico {
  id: number;
  nome: string;
  total: number;
}

export interface MedicosComMaisConsultasNoMes {
  id: number;
  nome: string;
  total: number;
}

export interface MedicosPorEspecialidade {
  especialidade: string;
  total: number;
}

export interface TaxaCancelamentoPorMedico {
  id: number;
  nome: string;
  taxa: string;
}

// Renomeado para evitar colisão com FaturamentoPorMedico do financial.models.ts,
// que usa idMedico/nomeMedico/totalFaturado em vez de id/nome/total.
export interface FaturamentoPorMedicoRelMedico {
  id: number;
  nome: string;
  total: number;
}
