export interface LoginRequest {
  username: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// Cadastro self-service de paciente: cria Usuario(funcao=PACIENTE) + Paciente
// numa única chamada pública. Espera-se que o back devolva LoginResponse para
// permitir auto-login após o cadastro.
export interface SignupRequest {
  nome: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  telefone: string;
  username: string;
  email: string;
  senha: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  novaSenha: string;
}
