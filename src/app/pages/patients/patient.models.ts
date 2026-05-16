import { Sort } from '@shared/models/pagination.model';

// Payload de criação/edição de paciente (mesmo shape para POST e PUT).
// dataNascimento: string ISO 'YYYY-MM-DD' (LocalDate do Spring).
export interface PacientePayload {
  nome: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  email: string;
  telefone: string;
}

// Interface para a tabela (dados com id obrigatórios e outros campos)
export interface PacienteTable {
  id: number;
  nome: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

// Interface para perfil detalhado do paciente
export interface PacienteProfile {
  id: number;
  nome: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

// Interface para filtros de pesquisa de pacientes
export interface PacienteFilter {
  nome?: string;
  cpf?: string;
  sexo?: string;
  ativo?: boolean;
}

// Ordenação enviada para o back
export type PacienteSortField = 'nome' | 'cpf' | 'sexo';
export type PacienteSort = Sort<PacienteSortField>;
