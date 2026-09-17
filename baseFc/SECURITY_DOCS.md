# Documentação de Segurança - Tríade CID

O projeto acadêmico **Base FC** foi desenvolvido mitigando vulnerabilidades comuns listadas na OWASP Top 10 e seguindo a tríade fundamental da segurança da informação, utilizando **Supabase (PostgreSQL)** e **Node.js (Express)**.

---

## 1. Confidencialidade (Confidentiality)
Garantimos que apenas usuários autorizados tenham acesso aos dados.

- **Autenticação**: Gerida pelo Supabase Auth com tokens JWT assinados criptograficamente. O backend valida a assinatura e a validade de cada requisição via `supabaseAdmin.auth.getUser(token)`.
- **Autorização (RBAC)**: O middleware `requireRole` (`src/backend/middlewares/rbac.middleware.ts`) assegura que o token pertença a um perfil com permissão explícita para o endpoint (`GESTOR`, `PROFESSOR`, `RESPONSAVEL`).
- **Proteção IDOR (Insecure Direct Object Reference)**: O middleware `checkStudentAccess` (`src/backend/middlewares/idor.middleware.ts`) intercepta requisições parametrizadas (ex: `GET /api/students/:id`). Ele consulta o PostgreSQL no Supabase para certificar que o registro pertence à mesma escola do Gestor, à turma do Professor ou ao filho do Responsável solicitante, devolvendo `HTTP 403` em qualquer divergência.
- **Row Level Security (RLS)**: Todas as tabelas no Supabase possuem RLS ativado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`). O acesso direto do cliente é restrito ao próprio perfil, enquanto o Backend atua como barreira com chave segura de serviço (`service_role`).
- **Isolamento de Segredos**: A `SUPABASE_SERVICE_ROLE_KEY` nunca é exposta no frontend, permanecendo exclusiva das variáveis de ambiente do backend.

---

## 2. Integridade (Integrity)
Garantimos que a informação só será alterada de forma legítima, consistente e auditável.

- **Validação no Backend**: O Express utiliza Zod (`src/backend/validators/student.validator.ts`) para exigir validação estrita de formatos (como CPF e datas) antes de qualquer persistência.
- **Auditoria de Ações (Audit Logs)**: Qualquer modificação ou cadastro sensível gera um registro inalterável na tabela `audit_logs` no PostgreSQL, gravando `quem` realizou, `qual` ação, `qual` recurso e `quando` ocorreu (`timestamp`).
- **Integridade Referencial com PostgreSQL**: O banco impõe integridade através de chaves primárias UUID, chaves estrangeiras (`REFERENCES schools(id) ON DELETE CASCADE`) e constraints `CHECK`.
- **Multi-tenancy Rígido**: O vínculo com a escola (`school_id`) é extraído diretamente da sessão do usuário autenticado no backend, impedindo adulteração de IDs pelo cliente.

---

## 3. Disponibilidade (Availability)
O sistema deve se manter operante, estável e resiliente contra ataques e sobrecargas.

- **Rate Limiting**: O middleware `express-rate-limit` restringe requisições no endpoint da API (máx. 100 requisições por janela de 15 minutos por IP) prevenindo ataques de Força Bruta e sobrecarga.
- **Tratamento de Erros Global**: O middleware `error.middleware.ts` captura falhas de execução, registra detalhes internamente no console do servidor, mas retorna apenas uma resposta genérica `HTTP 500`. Isso impede o vazamento de configurações internas, stack traces ou esquemas SQL que poderiam ser explorados em ataques.
- **Proteção de Cabeçalhos HTTP (Helmet)**: A biblioteca `helmet` configura cabeçalhos essenciais contra Clickjacking, X-Frame-Options e MIME-sniffing.
- **Deploy Resiliente na Nuvem**: Arquitetura desacoplada com backend hospedado no **Render** e frontend estático distribuído globalmente pela **Vercel**.
