import { Sort } from '@shared/models/pagination.model';

// Payload de criação/edição de médico (mesmo shape para POST e PUT).
export interface DoctorPayload {
  nome: string;
  crmSigla: string;
  crmDigitos: string;
  especialidade: string;
  email: string;
  telefone: string;
}

// Interface para a tabela (dados com id obrigatórios e outros campos)
export interface DoctorTable {
  id: number;
  nome: string;
  crmSigla: string;
  crmDigitos: string;
  especialidade: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

// Interface para perfil detalhado do médico
export interface DoctorProfile {
  id: number;
  nome: string;
  crmSigla: string;
  crmDigitos: string;
  especialidade: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

// Interface para filtros de pesquisa de médicos
export interface DoctorFilter {
  nome?: string;
  crmSigla?: string;
  crmDigitos?: string;
  especialidade?: string;
  ativo?: boolean;
}

// Ordenação enviada para o back
export type DoctorSortField = 'nome' | 'crm' | 'especialidade';
export type DoctorSort = Sort<DoctorSortField>;
