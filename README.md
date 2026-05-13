# Consultas Médicas — Front-end Angular

Front-end do sistema de gestão de consultas médicas. Permite autenticação por JWT, gestão de médicos (CRUD, filtros, ativar/inativar/excluir) e está preparado para crescer com módulos de pacientes, consultas e relatórios. Consome a API Spring Boot do projeto irmão [`spring-api-consultas-medicas`](https://github.com/wastecoder/spring-api-consultas-medicas).


## Stack
- Angular 19 (standalone, sem `AppModule`) com `strictTemplates`
- Angular Material (tema azure-blue) + Bootstrap 5
- ngx-mask para máscaras de input
- `jwt-decode` para leitura de claims do token
- TypeScript 5.7 em modo estrito


## Pré-requisitos
- Node.js 20+ e npm
- Back-end Spring `spring-api-consultas-medicas` rodando em `http://localhost:8080`
  - Repositório: https://github.com/wastecoder/spring-api-consultas-medicas
  - Siga o README do back para subir a API + Postgres (Docker ou IntelliJ).


## Como rodar

```bash
npm install
npm start
```

A aplicação sobe em `http://localhost:4200`. Para o primeiro login use a conta padrão (definida no `.env` do back-end):

- Usuário: `admin`
- Senha: `123456`


## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Servidor de desenvolvimento em `http://localhost:4200` |
| `npm run build` | Build de produção em `dist/angular-consultas-medicas/` |
| `npm run watch` | Build de desenvolvimento em watch mode |
| `npm test` | Executa Karma + Jasmine (sem testes reais ainda) |


## Estrutura de pastas

```
src/app/
├── pages/         # Telas por feature (home, login, logout, doctors/*)
├── services/      # Clientes HTTP (apis/auth, apis/doctor)
├── shared/        # Componentes, diretivas e serviços reutilizáveis
├── guards/        # authGuard, roleGuard
├── layouts/       # LayoutFullComponent (navbar + footer) e LayoutBlankComponent
└── app.routes.ts  # Roteamento aninhado em dois layouts
```

Use os path aliases definidos em `tsconfig.json` em vez de `../../..`: `@pages`, `@shared`, `@services`, `@guards`, `@env`.


## Funcionalidades implementadas
- Login com persistência em `localStorage` ("lembrar-me") ou `sessionStorage`
- Interceptor HTTP que anexa `Authorization: Bearer …` e redireciona em 401/403
- CRUD completo do módulo de Médicos (paginação server-side, ordenação, filtros)
- Ativar / inativar / excluir médico com diálogo de confirmação
- RBAC: botões e rotas conforme a função do JWT (ADMIN / RECEPCIONISTA / MEDICO / PACIENTE)
- Feedback global de loading (`MatProgressBar`) e notificações via `SnackbarService`

Outros módulos (Pacientes, Consultas, Relatórios) ainda não estão no front — eles existem no back e serão consumidos em fases futuras.
