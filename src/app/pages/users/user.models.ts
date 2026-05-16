import { Funcao } from '@shared/auth/role.types';
import { Sort } from '@shared/models/pagination.model';

// Payload de criação de usuário (POST /usuarios). idAssociado é obrigatório
// quando funcao = MEDICO ou PACIENTE, e deve ser null para ADMIN/RECEPCIONISTA.
export interface UsuarioCreatePayload {
  username: string;
  email: string;
  senha: string;
  funcao: Funcao;
  idAssociado?: number | null;
}

// Payload de atualização (PUT /usuarios/{id}). Back só aceita username, email
// e opcionalmente senha (funcao e ativo são imutáveis por esse endpoint).
export interface UsuarioUpdatePayload {
  username: string;
  email: string;
  senha?: string;
}

export interface UsuarioTable {
  id: number;
  username: string;
  email: string;
  funcao: Funcao;
  ativo: boolean;
}

export interface AuditoriaResposta {
  createdBy: string | null;
  createdDate: string | null;
  lastModifiedBy: string | null;
  lastModifiedDate: string | null;
}

export interface UsuarioProfile extends UsuarioTable {
  auditoria?: AuditoriaResposta;
}

// Filtros aceitos pela UI. O back ainda não suporta filtragem server-side;
// a lista aplica filtragem client-side enquanto isso.
export interface UsuarioFilter {
  username?: string;
  funcao?: Funcao;
  ativo?: boolean;
}

export type UsuarioSortField = 'username' | 'email' | 'funcao';
export type UsuarioSort = Sort<UsuarioSortField>;
