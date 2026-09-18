# Base FC - Gestão de Escolinhas de Futebol

Sistema acadêmico full-stack estruturado seguindo os preceitos de Segurança da Informação, utilizando Node.js (Express), Supabase (PostgreSQL + Auth) e React (Vite).

## 🚀 Arquitetura & Tecnologias
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM (Pronto para deploy na **Vercel**).
- **Backend**: Node.js, Express, Supabase Client SDK, TypeScript (Pronto para deploy no **Render**).
- **Banco de Dados**: Supabase (PostgreSQL relacional com Row Level Security).
- **Segurança**: Zod (schema validation), Helmet (Headers), express-rate-limit (DDoS protection), RBAC Customizado, middlewares de auditoria IDOR e Trilha de Auditoria (Audit Logs).

## 📂 Estrutura de Pastas (MVC)
- `/src/backend`: API REST completa.
  - `/config`: Conexão com Supabase (`supabase.ts`).
  - `/controllers`: Lógica de requisição/resposta (HTTP).
  - `/middlewares`: Barreiras de segurança (Auth, RBAC, IDOR, Errors).
  - `/routes`: Mapeamento de rotas.
  - `/services`: Regras de negócio e persistência no banco (PostgreSQL).
  - `/validators`: Schemas Zod.
- `/src/frontend`: Componentes React e Dashboards.
  - `/components`: UI reutilizável.
  - `/contexts`: Estado global de Autenticação com Supabase Auth.
  - `/pages`: Telas específicas por perfis.
  - `/services`: Fetch calls para a API Express e cliente Supabase.
- `/supabase`:
  - `schema.sql`: Script DDL com tabelas, chaves estrangeiras, índices e RLS.

## ⚙️ Configuração & Execução Local

1. Copie o arquivo de exemplo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Preencha suas credenciais do Supabase no `.env`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta
   ```
3. Execute o script `supabase/schema.sql` no **SQL Editor** do painel do seu Supabase.
4. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000`.

## ☁️ Guia de Deploy em Nuvem

### 1. Banco de Dados & Auth (Supabase)
1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Vá em **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Vá em **Project Settings > API** para copiar a URL, `anon key` e `service_role key`.

### 2. Backend (Render)
1. Crie um **Web Service** no [Render](https://render.com) conectado ao repositório.
2. Defina o Root Directory como `baseFc`.
3. Configure os comandos:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`: sua URL do Supabase.
   - `VITE_SUPABASE_ANON_KEY`: sua chave anônima.
   - `SUPABASE_SERVICE_ROLE_KEY`: sua chave de serviço secreta.
   - `CORS_ORIGIN`: URL gerada pela Vercel para seu frontend (ex: `https://seu-app.vercel.app`).

### 3. Frontend (Vercel)
1. Importe o repositório na [Vercel](https://vercel.com).
2. Defina o Root Directory como `baseFc`.
3. Configure as variáveis de ambiente na Vercel:
   - `VITE_SUPABASE_URL`: sua URL do Supabase.
   - `VITE_SUPABASE_ANON_KEY`: sua chave anônima.
4. Clique em **Deploy**.

Consulte o arquivo `SECURITY_DOCS.md` para o detalhamento da Tríade CID.
