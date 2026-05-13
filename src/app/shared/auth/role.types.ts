export type Funcao = 'ADMIN' | 'RECEPCIONISTA' | 'MEDICO' | 'PACIENTE';

const FUNCOES: readonly Funcao[] = ['ADMIN', 'RECEPCIONISTA', 'MEDICO', 'PACIENTE'];

export function isFuncao(value: string): value is Funcao {
  return (FUNCOES as readonly string[]).includes(value);
}
