# Documentação de Segurança - Tríade CID

O projeto acadêmico **Base FC** foi desenvolvido mitigando vulnerabilidades comuns listadas na OWASP Top 10 e seguindo a tríade fundamental da segurança da informação.

## 1. Confidencialidade (Confidentiality)
Garantimos que apenas usuários autorizados tenham acesso aos dados.

- **Autenticação**: Gerida pelo Firebase Auth, utilizando tokens JWT assinados criptograficamente.
- **Autorização (RBAC)**: O middleware `requireRole` (`src/backend/middlewares/rbac.middleware.ts`) assegura que o token pertença a uma Role autorizada a acessar o endpoint.
- **Proteção IDOR (Insecure Direct Object Reference)**: Um middleware específico (`checkStudentAccess` em `src/backend/middlewares/idor.middleware.ts`) intercepta todas as requisições envolvendo recursos parametrizados (ex: `GET /api/students/:id`). Ele vai até o banco, avalia a quem o dado pertence, e cruza com a identidade e o perfil (`schoolId`, `role`) de quem o requisita, retornando `HTTP 403` quando necessário.
- **Senhas e Segredos**: Senhas nunca são armazenadas em texto puro (o Firebase gerencia o hash usando algoritmos fortificados baseados em scrypt). As chaves de serviço ficam encapsuladas nas variáveis de ambiente.

## 2. Integridade (Integrity)
Garantimos que a informação só será alterada de forma legítima e consistente.

- **Validação no Backend**: O Frontend não é confiável. O Express utiliza o Zod (`src/backend/validators/student.validator.ts`) para forçar um schema de dados rígido antes de qualquer gravação no banco.
- **Auditoria de Ações**: Modificações sensíveis criam rastros inalteráveis. O método `createStudent` injeta automaticamente um registro na coleção `audit_logs`, registrando `quem`, `o que`, `quando` e `onde` a operação foi feita.
- **Isolamento de Banco**: A regra de negócio não está na camada visual. Toda persistência passa pelo Backend que valida os vínculos de IDs de escola (multi-tenant) e turmas.

## 3. Disponibilidade (Availability)
O sistema deve se manter operante, estável e resiliente contra ataques.

- **Rate Limiting**: A biblioteca `express-rate-limit` restringe requisições no endpoint da API (máx. 100 reqs / 15 min por IP) prevenindo ataques de Força Bruta e DDoS de baixa complexidade.
- **Tratamento de Erros Global**: O middleware `error.middleware.ts` intercepta exceções, loga o stack trace internamente no servidor, mas devolve ao cliente apenas um `HTTP 500` genérico. Isso impede o vazamento de configurações internas ou query structures que atacantes poderiam explorar.
- **Segurança de Cabeçalho (Helmet)**: A biblioteca `helmet` configura headers essenciais contra Clickjacking e Sniffing de MIME-Type.
