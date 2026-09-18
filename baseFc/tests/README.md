# Suíte de Testes Automatizados de Segurança (Tríade CID) - Base FC

Guia oficial para demonstrar e comprovar para o professor da disciplina de **Segurança da Informação (FICR)** que as defesas do sistema estão 100% ativas e funcionais.

---

## 🎯 O Que Esta Bateria de Testes Comprova?

A suíte executa testes de intrusão defensivos e validação de conformidade divididos nos três pilares da **Tríade CID**:

### 1. 🔒 Confidencialidade (C)
- **C1**: Bloqueio imediato de acessos anônimos (`HTTP 401 Unauthorized`) em endpoints sensíveis (ex: `/api/students`).
- **C2**: Rejeição de tokens JWT adulterados, falsificados ou com chave secreta inválida (`HTTP 401 Unauthorized`).
- **C3**: Blindagem da trilha de auditoria corporativa (`/api/audit-logs`) contra visualização não autorizada.
- **C4**: Bloqueio de mutações estruturais (criação de turmas e atribuição de professores) para requisições anônimas.

### 2. 🛡️ Integridade (I)
- **I1**: Rejeição de CPFs matematicamente inválidos e dados espúrios antes de persistência no PostgreSQL.
- **I2**: Validação de Schemas estritos com Zod, impedindo gravação de payloads parciais ou campos obrigatórios faltantes.
- **I3**: Aplicação de regras de negócio esportivas (números de camisa estritamente entre 1 e 99, faixas etárias de 6 a 16 anos).
- **I4**: Rejeição de caracteres numéricos no nome do responsável legal e contatos de emergência (Zod Regex & Defesa de Entrada).

### 3. ⚡ Disponibilidade e Resiliência (D)
- **D1**: Healthcheck operacional ativo com tempo de resposta em milissegundos (`GET /api/health`).
- **D2**: Hardening de cabeçalhos HTTP via **Helmet** (`X-Content-Type-Options: nosniff` e ocultação do cabeçalho `X-Powered-By`).
- **D3**: Fuzzing/Resiliência: Envio de payloads corrompidos sem derrubar o servidor Node.js e sem vazamento de stack traces ou arquivos internos.
- **D4**: Configuração de Preflight CORS seguro respondendo requisições cruzadas com `HTTP 204`.

---

## 🚀 Como Executar os Testes

### Pré-requisito
Certifique-se de ter o Python 3 e a biblioteca `requests` instalados:
```bash
pip install requests
```

### 1. Executando contra a API no Render
```bash
python3 tests_security/test_security_cid.py --url https://https-basefc-onrender-com.onrender.com
```

### 2. Executando Localmente (em Desenvolvimento)
Se você estiver rodando a API localmente na porta 3000:
```bash
python3 tests_security/test_security_cid.py --url http://localhost:3000
```

### 3. Exportando o Relatório em Arquivo para Entrega Acadêmica
Para gerar um arquivo `.txt` formatado para anexar ao trabalho ou slide da faculdade:
```bash
python3 tests_security/test_security_cid.py --url https://https-basefc-onrender-com.onrender.com > relatorio_seguranca.txt
```
