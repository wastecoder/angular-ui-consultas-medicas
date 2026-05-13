const apiHost = 'https://TODO-definir-host-de-producao'; // TODO: definir quando o item 30 (deploy) for executado
const apiPort = '';

export const environment = {
  production: true,
  apiHost,
  apiPort,
  apiUrl: apiPort ? `${apiHost}:${apiPort}/` : `${apiHost}/`,
  tokenKey: 'jwt_token'
};
