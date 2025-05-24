// Interface para criação de médico (sem o id)
export interface MedicoCreate {
  nome: string;
  crm: string;
  especialidade: string;
  email: string;
  telefone: string;
}

// Interface para edição de médico (com o id)
export interface MedicoEdit {
  id: number;
  nome: string;
  crm: string;
  especialidade: string;
  email: string;
  telefone: string;
}

// Interface para a tabela (dados com id obrigatórios e outros campos)
export interface MedicoTable {
  id: number;
  nome: string;
  crm: string;
  especialidade: string;
  email: string;
  telefone: string;
}
