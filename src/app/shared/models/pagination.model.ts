// Estrutura de resposta paginada vinda do Spring (Page<T>)
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type SortDirection = 'asc' | 'desc';

// Ordenação genérica enviada ao back; cada módulo declara seu próprio
// TField (ex.: DoctorSortField = 'nome' | 'crm' | 'especialidade').
export interface Sort<TField extends string> {
  ordenarPor: TField;
  direcao: SortDirection;
}
