const apiHost = 'http://localhost';
const apiPort = '8080';

export const environment = {
  production: false,
  apiHost,
  apiPort,
  apiUrl: `${apiHost}:${apiPort}/`,
  tokenKey: 'jwt_token' // Nome fixo da chave no localStorage
};
