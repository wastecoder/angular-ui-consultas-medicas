// Interface para criação de médico (sem o id)
export interface CreateDoctor {
  nome: string;
  crmSigla: string;
  crmDigitos: string;
  especialidade: string;
  email: string;
  telefone: string;
}

// Interface para edição de médico (com o id)
export interface EditDoctor {
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
}

// Estrutura de resposta paginada vinda do Spring (Page<T>)
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
