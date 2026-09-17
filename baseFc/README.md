# Base FC - Gestão de Escolinhas de Futebol

Sistema acadêmico full-stack estruturado seguindo os preceitos de Segurança da Informação, utilizando Node.js (Express), Firebase (Firestore + Auth) e React (Vite).

## 🚀 Arquitetura & Tecnologias
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM.
- **Backend**: Node.js, Express, Firebase Admin SDK (Firestore), TypeScript.
- **Segurança**: Zod (schema validation), Helmet (Headers), express-rate-limit (DDoS protection), RBAC Customizado, middlewares de auditoria IDOR.
- **Banco de Dados**: Firestore (NoSQL) isolado através da camada de repositório no backend (o client não acessa diretamente os dados).

## 📂 Estrutura de Pastas (MVC)
- `/src/backend`: Contém a API REST completa.
  - `/config`: Conexões com Firebase.
  - `/controllers`: Lógica de requisição/resposta (HTTP).
  - `/middlewares`: Barreiras de segurança (Auth, RBAC, IDOR, Errors).
  - `/routes`: Mapeamento de rotas.
  - `/services`: Regras de negócio e persistência no banco (Firestore).
  - `/validators`: Schemas Zod.
- `/src/frontend`: Componentes React e Dashboards.
  - `/components`: UI reutilizável.
  - `/contexts`: Estado global de Autenticação.
  - `/pages`: Telas específicas por perfis.
  - `/services`: Fetch calls para a API Express.

## 🔐 Como executar e testar a Segurança
1. O backend provê endpoints seguros em `/api/*`.
2. Para testar o login, utilize o provedor Google (ativado por padrão) para contornar a necessidade de habilitar E-mail/Senha manualmente no Firebase Console, que é um requisito de infraestrutura externa.
3. Ao logar, a conta assume um perfil (`GESTOR`, `PROFESSOR`, `RESPONSAVEL`) cujo acesso é verificado rigidamente nos Middlewares.

Consulte o arquivo `SECURITY_DOCS.md` para o detalhamento da Tríade CID.
