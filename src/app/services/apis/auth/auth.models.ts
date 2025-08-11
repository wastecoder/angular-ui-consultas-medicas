export interface LoginRequest {
  username: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}
