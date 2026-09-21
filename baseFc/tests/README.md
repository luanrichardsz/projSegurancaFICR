# Suíte de Testes Automatizados de Segurança (Tríade CID) - Base FC

Guia oficial para demonstrar e comprovar para o professor da disciplina de **Segurança da Informação (FICR)** que as defesas do sistema estão 100% ativas e funcionais.

---

## 🎯 O Que Esta Bateria de Testes Comprova e Exemplos nas Telas

A suíte executa testes de intrusão defensivos e validação de conformidade divididos nos três pilares da **Tríade CID**. Abaixo estão descritos o que cada teste avalia e **2 exemplos práticos de como cada um se manifesta nas telas do sistema**:

---

### 1. 🔒 Confidencialidade (C)

#### **C1: Bloqueio de acessos anônimos em endpoints sensíveis (`HTTP 401 Unauthorized`)**
* **Exemplo na Tela 1 (Navegação sem autenticação):** Se um usuário não autenticado abrir uma aba anônima e tentar acessar diretamente a URL `http://localhost:3000/alunos` ou a rota de produção, a aplicação intercepta via `<PrivateRoute>`, bloqueia a visualização e redireciona instantaneamente para a tela de **Login** (`/login`).
* **Exemplo na Tela 2 (Acesso direto à API no Navegador):** Se alguém colar a URL `https://https-basefc-onrender-com.onrender.com/api/students` na barra de endereços do navegador sem enviar o cabeçalho `Authorization: Bearer <token>`, a tela exibirá a resposta JSON de defesa: `{"error": "Não autorizado: Token não fornecido."}` com status `HTTP 401`.

#### **C2: Rejeição de tokens JWT adulterados, forjados ou expirados (`HTTP 401 Unauthorized`)**
* **Exemplo na Tela 1 (Manipulação de Token no DevTools):** Se um usuário abrir o console do navegador (`F12 > Application > Local Storage`), adulterar o token JWT adicionando caracteres aleatórios e recarregar a tela de Alunos, a tela detectará a falha de assinatura, exibirá o alerta de sessão expirada e desconectará o usuário.
* **Exemplo na Tela 2 (Disparo via Console com Bearer inválido):** Ao executar no Console do navegador `fetch('/api/students', { headers: { Authorization: 'Bearer token_falso_123' } })`, a aba *Network* destacará a requisição em **vermelho com status 401**, comprovando que o middleware criptográfico rejeitou a chave forjada.

#### **C3: Blindagem da trilha de auditoria corporativa (`/api/audit-logs`)**
* **Exemplo na Tela 1 (Controle de Acesso RBAC no Menu):** Quando um usuário com perfil `RESPONSAVEL` se autentica, o item **"Auditoria"** sequer aparece na barra lateral de navegação (Sidebar). Se ele tentar forçar a digitação de `/auditoria` na URL, o sistema impede o acesso.
* **Exemplo na Tela 2 (Tela do Gestor vs Bloqueio Externo):** A tela de **Auditoria** (`/auditoria`) com tabela detalhada de rastros (IP, data/hora, ação realizada e recurso) só renderiza para o perfil `GESTOR`. Qualquer tentativa anônima de consultar `/api/audit-logs` é barrada com `HTTP 401`, impedindo o vazamento de segredos de compliance.

#### **C4: Bloqueio de mutações estruturais (Criação de turmas e professores)**
* **Exemplo na Tela 1 (Ocultação de Botões de Ação para Não-Gestores):** Na tela de **Turmas** (`/turmas`), botões de impacto estrutural como **"+ Nova Turma"** e ícones de exclusão/edição ficam indisponíveis para perfis sem privilégios administrativos.
* **Exemplo na Tela 2 (Tentativa de POST não autorizado):** Se um atacante enviar um formulário forjado para `POST /api/classes` sem credenciais válidas tentando criar uma "Turma Invasora", o servidor recusa a gravação com `HTTP 401` e nenhuma alteração é persistida no banco.

---

### 2. 🛡️ Integridade (I)

#### **I1: Rejeição de CPFs matematicamente inválidos**
* **Exemplo na Tela 1 (Formulário de Nova Matrícula - `/alunos/novo`):** Ao digitar no campo "CPF do Atleta" ou "CPF do Responsável" um número com dígitos repetidos inválidos (ex: `111.111.111-11`) e clicar em "Salvar Matrícula", a tela exibe no topo o alerta em vermelho: *"O CPF informado para o atleta é inválido. Verifique os dígitos digitados."* e trava a submissão.
* **Exemplo na Tela 2 (Modal de Edição do Atleta):** Ao tentar editar um aluno existente e alterar seu CPF para um valor com dígito verificador incorreto, a tela barra a alteração com mensagem de inconsistência e impede o envio para o PostgreSQL.

#### **I2: Validação de Schemas estritos com Zod (Campos obrigatórios ausentes)**
* **Exemplo na Tela 1 (Envio de Formulário Parcial em `/alunos/novo`):** Se o usuário preencher apenas o CPF e tentar salvar deixando o "Nome do Atleta", "Data de Nascimento" ou "Categoria" em branco, o validador Zod rejeita a requisição e a tela destaca os campos pendentes exigindo o preenchimento obrigatório.
* **Exemplo na Tela 2 (Lançamento Avulso de Mensalidade em `/mensalidades`):** No modal "Lançamento Avulso", se o gestor tentar submeter a cobrança sem selecionar o atleta no menu dropdown, a tela emite o alerta *"Selecione um atleta"* e o backend descarta o payload incompleto com `HTTP 400 Bad Request`.

#### **I3: Aplicação de regras de negócio esportivas (Camisas 1-99 e Idade 6-16 anos)**
* **Exemplo na Tela 1 (Número de Camisa fora da faixa em `/alunos/novo`):** Se o usuário tentar colocar o número de camisa `9999` ou `0`, ao submeter a tela exibe o erro: *"O número da camisa deve conter no máximo 2 dígitos (entre 1 e 99)."*, mantendo o padrão das categorias de base de futebol.
* **Exemplo na Tela 2 (Idade incompatível com categorias de base):** Se for inserida uma data de nascimento que resulte em uma idade menor que 6 anos ou maior que 16 anos (ex: atleta de 25 anos), a tela calcula automaticamente e avisa: *"A idade do atleta é de X anos. A escolinha aceita apenas atletas entre 6 e 16 anos (categorias Sub-7 ao Sub-17)."*

#### **I4: Rejeição de caracteres numéricos no nome do responsável legal e contatos**
* **Exemplo na Tela 1 (Sanitização e Bloqueio ao Digitar em `/alunos/novo`):** No campo "Nome do Responsável", caso o usuário tente digitar números (ex: `Marcos123`), o campo filtra em tempo real via regex e não permite que os números sejam inseridos no input.
* **Exemplo na Tela 2 (Validação de Envio no Modal de Edição):** Caso um nome contendo números seja colado ou forçado no formulário (ex: `Ana 2026`), ao clicar em "Salvar Alterações" a tela trava o envio e exibe: *"O nome do responsável não pode conter números."*, com o backend rejeitando com `HTTP 400`.

---

### 3. ⚡ Disponibilidade e Resiliência (D)

#### **D1: Healthcheck operacional ativo com tempo de resposta em milissegundos (`GET /api/health`)**
* **Exemplo na Tela 1 (Consulta Direta no Navegador):** Ao acessar no navegador a rota `https://https-basefc-onrender-com.onrender.com/api/health`, a tela renderiza imediatamente o status operacional do backend: `{"status": "ok", "uptime": 1420.5, "timestamp": "2026-09-18T..."}` com resposta em menos de 500ms.
* **Exemplo na Tela 2 (Painel do Gestor `/`):** Ao carregar o Painel do Gestor, o banner superior verde exibe a badge *"• Tríade CID"* e todos os 4 cards de KPIs (Atletas Ativos, Turmas, Mensalidades e Arrecadação) carregam sem travamentos, comprovando a disponibilidade contínua dos microsserviços.

#### **D2: Hardening de cabeçalhos HTTP via Helmet (`nosniff` e ocultação de `X-Powered-By`)**
* **Exemplo na Tela 1 (Aba Network do Inspecionar Elemento - MIME Sniffing):** Abrindo as ferramentas de desenvolvedor (`F12 > Network`), ao inspecionar os headers de qualquer resposta, visualiza-se `X-Content-Type-Options: nosniff`, impedindo que navegadores executem arquivos simulados como scripts maliciosos.
* **Exemplo na Tela 2 (Ocultação de Fingerprint Tecnológico):** Na mesma aba de Headers de resposta, nota-se a total remoção do cabeçalho `X-Powered-By: Express`. Com isso, a tela não revela a atacantes qual framework web ou versão de Node.js está rodando nos servidores.

#### **D3: Fuzzing/Resiliência: Payloads corrompidos sem queda do servidor nem vazamento de stack traces**
* **Exemplo na Tela 1 (Tratamento de JSON quebrado):** Ao enviar propositalmente um JSON corrompido ou malformado (ex: `{"name": "Aluno", `), a aplicação não trava, o servidor não cai (prevenindo negação de serviço/DoS) e responde com `HTTP 400 Bad Request` padronizado.
* **Exemplo na Tela 2 (Proteção de Diretórios Internos):** Na resposta de erro que aparece na tela/ferramenta, o servidor **não vaza** caminhos de pastas do sistema operacional (como `/home/luandev/...` ou `node_modules`), impedindo a enumeração de arquivos do servidor por atacantes.

#### **D4: Configuração de Preflight CORS seguro**
* **Exemplo na Tela 1 (Comunicação Frontend Vercel -> Backend Render):** Quando o frontend na Vercel dispara requisições seguras `POST` ou `PUT`, a aba Network da tela exibe a requisição de pré-checagem com método **`OPTIONS`**, respondida com **`HTTP 204 No Content`** e com as diretivas `Access-Control-Allow-Origin` autorizadas.
* **Exemplo na Tela 2 (Bloqueio de Origens Invasoras no Console):** Se um site malicioso de terceiros tentar enviar comandos em segundo plano se passando pelo usuário, o navegador bloqueia a chamada e emite no Console: *"Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource"*.

---

## 🚀 Como Executar a Bateria Automatizada de Testes

### Pré-requisito
Certifique-se de ter o Python 3 e a biblioteca `requests` instalados:
```bash
pip install requests
```

### 1. Executando contra a API no Render (Produção)
```bash
python3 baseFc/tests/test_security_cid.py --url https://https-basefc-onrender-com.onrender.com
```

### 2. Executando Localmente (em Desenvolvimento)
Se você estiver rodando a API localmente na porta 3000:
```bash
python3 baseFc/tests/test_security_cid.py --url http://localhost:3000
```

### 3. Exportando o Relatório em Arquivo para Entrega Acadêmica
Para gerar um arquivo `.txt` formatado para anexar ao trabalho ou slide da faculdade:
```bash
python3 baseFc/tests/test_security_cid.py --url https://https-basefc-onrender-com.onrender.com > relatorio_seguranca.txt
```
