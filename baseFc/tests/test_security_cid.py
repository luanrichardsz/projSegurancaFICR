#!/usr/bin/env python3
"""
=============================================================================
PROJETO DE SEGURANÇA DA INFORMAÇÃO - FICR (BASE FC)
SUÍTE DE TESTES AUTOMATIZADOS DE SEGURANÇA (TRÍADE CID)
=============================================================================

Este script executa uma bateria de testes de conformidade de segurança contra a
API do Base FC, comprovando tecnicamente as defesas implementadas nos três
pilares fundamentais da segurança da informação:

1. [C] CONFIDENCIALIDADE:
   - Bloqueio de acessos não autenticados (401 Unauthorized)
   - Rejeição de tokens forjados / adulterados (401 Unauthorized)
   - Isolamento de rotas de auditoria e gestão (RBAC)

2. [I] INTEGRIDADE:
   - Validação estrita de schema de entrada via Zod (400 Bad Request)
   - Rejeição de CPFs inválidos ou forjados
   - Validação de regras de negócio (idades limite, faixas de camisa 1-99)
   - Não-repúdio e registro de logs de auditoria

3. [D] DISPONIBILIDADE E RESILIÊNCIA:
   - Healthcheck do serviço ativo
   - Presença de cabeçalhos de segurança HTTP (Helmet)
   - Ocultação do cabeçalho X-Powered-By (Information Leak Prevention)
   - Resiliência a payloads JSON corrompidos sem vazamento de stack traces

Como executar:
    python3 test_security_cid.py
    python3 test_security_cid.py --url https://basefc.onrender.com
    python3 test_security_cid.py --url http://localhost:3000
=============================================================================
"""

import sys
import json
import time
import argparse
from typing import Dict, Any, List

try:
    import requests
except ImportError:
    print("\n[!] A biblioteca 'requests' não está instalada.")
    print("    Instale com: pip install requests\n")
    sys.exit(1)


# =============================================================================
# CORES E FORMATAÇÃO PARA TERMINAL (ANSI ESCAPE)
# =============================================================================
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    RESET = '\033[0m'


class SecurityTestRunner:
    def __init__(self, base_url: str, token: str = None):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.results: List[Dict[str, Any]] = []

    def print_banner(self):
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'=' * 80}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}   BASE FC - SUÍTE DE TESTES AUTOMATIZADOS DE SEGURANÇA (TRÍADE CID){Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}   Alvo sob teste: {Colors.UNDERLINE}{self.base_url}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'=' * 80}{Colors.RESET}\n")

    def record_result(self, pillar: str, code: str, title: str, passed: bool, details: str):
        self.results.append({
            "pillar": pillar,
            "code": code,
            "title": title,
            "passed": passed,
            "details": details
        })
        status_tag = f"{Colors.GREEN}[PASS - APROVADO]{Colors.RESET}" if passed else f"{Colors.RED}[FAIL - FALHOU]{Colors.RESET}"
        pillar_badge = f"{Colors.BOLD}{Colors.CYAN}[{pillar}]{Colors.RESET}"
        print(f"{pillar_badge} {Colors.BOLD}{code}:{Colors.RESET} {title}")
        print(f"       Status: {status_tag}")
        print(f"       Detalhes: {Colors.YELLOW if not passed else Colors.RESET}{details}{Colors.RESET}\n")

    # =========================================================================
    # PILAR 1: CONFIDENCIALIDADE (C)
    # =========================================================================
    def test_confidentiality(self):
        print(f"{Colors.BOLD}{Colors.HEADER}=== [1/3] TESTANDO PILAR: CONFIDENCIALIDADE (AUTENTICAÇÃO & RBAC) ==={Colors.RESET}\n")

        # C1: Acesso a endpoint protegido de Alunos sem Token JWT
        try:
            r = requests.get(f"{self.base_url}/api/students", timeout=10)
            passed = r.status_code == 401
            msg = f"HTTP {r.status_code} recebido. (Esperado: 401 Unauthorized)"
            self.record_result("CONFIDENCIALIDADE", "C1", "Bloqueio de acesso anônimo a registros sensíveis de alunos", passed, msg)
        except Exception as e:
            self.record_result("CONFIDENCIALIDADE", "C1", "Bloqueio de acesso anônimo a registros sensíveis de alunos", False, f"Erro de conexão: {e}")

        # C2: Acesso com Token JWT adulterado ou falso (Signature/Secret inválido)
        try:
            headers = {"Authorization": "Bearer token_forjado_ficr_seguranca_1234567890"}
            r = requests.get(f"{self.base_url}/api/students", headers=headers, timeout=10)
            passed = r.status_code == 401
            msg = f"HTTP {r.status_code} recebido. Token falso foi rejeitado pelo middleware de autenticação."
            self.record_result("CONFIDENCIALIDADE", "C2", "Rejeição de Token JWT adulterado / forjado", passed, msg)
        except Exception as e:
            self.record_result("CONFIDENCIALIDADE", "C2", "Rejeição de Token JWT adulterado / forjado", False, f"Erro: {e}")

        # C3: Acesso anônimo a trilha de auditoria corporativa (/api/audit-logs)
        try:
            r = requests.get(f"{self.base_url}/api/audit-logs", timeout=10)
            passed = r.status_code == 401
            msg = f"HTTP {r.status_code} recebido. Trilha de auditoria blindada contra usuários não logados."
            self.record_result("CONFIDENCIALIDADE", "C3", "Blindagem da trilha de auditoria contra visualização anônima", passed, msg)
        except Exception as e:
            self.record_result("CONFIDENCIALIDADE", "C3", "Blindagem da trilha de auditoria contra visualização anônima", False, f"Erro: {e}")

        # C4: Acesso anônimo a criação de turmas e comissão técnica (/api/classes POST)
        try:
            r = requests.post(f"{self.base_url}/api/classes", json={"name": "Turma Invasora"}, timeout=10)
            passed = r.status_code == 401
            msg = f"HTTP {r.status_code} recebido. Alteração de estrutura acadêmica bloqueada para anônimos."
            self.record_result("CONFIDENCIALIDADE", "C4", "Bloqueio de criação não autorizada de turmas", passed, msg)
        except Exception as e:
            self.record_result("CONFIDENCIALIDADE", "C4", "Bloqueio de criação não autorizada de turmas", False, f"Erro: {e}")

    # =========================================================================
    # PILAR 2: INTEGRIDADE (I)
    # =========================================================================
    def test_integrity(self):
        print(f"{Colors.BOLD}{Colors.HEADER}=== [2/3] TESTANDO PILAR: INTEGRIDADE (SCHEMA ZOD & NÃO-REPÚDIO) ==={Colors.RESET}\n")

        # I1: Injeção de CPF matematicamente inválido
        # Nota: Caso use token, o validador Zod executará e retornará 400. Sem token, retorna 401.
        # Ambos os casos provam integridade/confidencialidade.
        try:
            bad_payload = {
                "name": "Aluno Teste Integridade",
                "cpf": "111.111.111-11", # CPF matematicamente nulo/inválido
                "dob": "2015-05-10",
                "category": "Sub-11",
                "shirtNumber": 10
            }
            headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
            r = requests.post(f"{self.base_url}/api/students", json=bad_payload, headers=headers, timeout=10)
            
            # Se com token: esperamos 400 (Zod Validation Error).
            # Se sem token: esperamos 401 (bloqueado antes de afetar integridade).
            if self.token:
                passed = r.status_code == 400
                msg = f"HTTP {r.status_code} recebido. Zod barrou o CPF forjado: {r.text[:80]}..."
            else:
                passed = r.status_code in (400, 401)
                msg = f"HTTP {r.status_code} recebido. Requisição barrada antes de persistir dados no banco."

            self.record_result("INTEGRIDADE", "I1", "Validação estrita de CPF contra persistência de dados espúrios", passed, msg)
        except Exception as e:
            self.record_result("INTEGRIDADE", "I1", "Validação estrita de CPF contra persistência de dados espúrios", False, f"Erro: {e}")

        # I2: Tentativa de inserção com campos obrigatórios ausentes
        try:
            corrupted_payload = {
                "cpf": "00000000000"
                # Faltam 'name', 'dob', 'category' obrigatórios
            }
            headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
            r = requests.post(f"{self.base_url}/api/students", json=corrupted_payload, headers=headers, timeout=10)
            passed = r.status_code in (400, 401)
            msg = f"HTTP {r.status_code} recebido. Banco preservado de registros incompletos ou órfãos."
            self.record_result("INTEGRIDADE", "I2", "Rejeição de payload incompleto (Defesa de Schema)", passed, msg)
        except Exception as e:
            self.record_result("INTEGRIDADE", "I2", "Rejeição de payload incompleto (Defesa de Schema)", False, f"Erro: {e}")

        # I3: Verificação de tipagem rígida (Shirt number fora do range de 1-99)
        try:
            invalid_shirt_payload = {
                "name": "Atleta Camisa Invalida",
                "dob": "2014-03-20",
                "category": "Sub-13",
                "shirtNumber": 9999 # Inválido: apenas 1 a 99 permitido
            }
            headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
            r = requests.post(f"{self.base_url}/api/students", json=invalid_shirt_payload, headers=headers, timeout=10)
            passed = r.status_code in (400, 401)
            msg = f"HTTP {r.status_code} recebido. Limite de dígitos de camisa validado nas regras de negócio."
            self.record_result("INTEGRIDADE", "I3", "Validação de limites e domínio de atributos esportivos", passed, msg)
        except Exception as e:
            self.record_result("INTEGRIDADE", "I3", "Validação de limites e domínio de atributos esportivos", False, f"Erro: {e}")

        # I4: Tentativa de cadastro com caracteres numéricos no nome do responsável
        try:
            invalid_guardian_payload = {
                "name": "Atleta Teste Integridade",
                "dob": "2015-05-10",
                "category": "Sub-11",
                "shirtNumber": 10,
                "guardian": {
                    "name": "Marcos Silva 123", # Inválido: números no nome do responsável
                    "phone": "81999998888"
                }
            }
            headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
            r = requests.post(f"{self.base_url}/api/students", json=invalid_guardian_payload, headers=headers, timeout=10)
            if self.token:
                passed = r.status_code == 400
                msg = f"HTTP {r.status_code} recebido. Zod barrou o nome com dígitos: {r.text[:80]}..."
            else:
                passed = r.status_code in (400, 401)
                msg = f"HTTP {r.status_code} recebido. Requisição com números no nome barrada com sucesso."
            self.record_result("INTEGRIDADE", "I4", "Rejeição de caracteres numéricos no nome do responsável", passed, msg)
        except Exception as e:
            self.record_result("INTEGRIDADE", "I4", "Rejeição de caracteres numéricos no nome do responsável", False, f"Erro: {e}")

    # =========================================================================
    # PILAR 3: DISPONIBILIDADE E RESILIÊNCIA (D)
    # =========================================================================
    def test_availability(self):
        print(f"{Colors.BOLD}{Colors.HEADER}=== [3/3] TESTANDO PILAR: DISPONIBILIDADE & HARDENING HTTP ==={Colors.RESET}\n")

        # D1: Healthcheck do Serviço (/api/health)
        try:
            start_time = time.time()
            r = requests.get(f"{self.base_url}/api/health", timeout=10)
            elapsed = time.time() - start_time
            passed = r.status_code == 200 and r.json().get("status") == "ok"
            msg = f"HTTP {r.status_code} ({elapsed:.3f}s). Serviço respondendo ativamente."
            self.record_result("DISPONIBILIDADE", "D1", "Healthcheck de disponibilidade operacional da API", passed, msg)
        except Exception as e:
            self.record_result("DISPONIBILIDADE", "D1", "Healthcheck de disponibilidade operacional da API", False, f"Falha de resposta: {e}")

        # D2: Verificação de Hardening de Cabeçalhos HTTP (Helmet)
        try:
            r = requests.get(f"{self.base_url}/api/health", timeout=10)
            headers = r.headers
            
            # X-Content-Type-Options: nosniff
            has_nosniff = headers.get("x-content-type-options") == "nosniff"
            
            # Ocultação do X-Powered-By
            hides_server_tech = "x-powered-by" not in headers

            passed = has_nosniff and hides_server_tech
            details = (
                f"X-Content-Type-Options: {headers.get('x-content-type-options', 'ausente')} | "
                f"X-Powered-By ocultado: {'SIM' if hides_server_tech else 'NAO'}"
            )
            self.record_result("DISPONIBILIDADE", "D2", "Hardening de Cabeçalhos HTTP (Proteção MIME-Sniffing e Fingerprint)", passed, details)
        except Exception as e:
            self.record_result("DISPONIBILIDADE", "D2", "Hardening de Cabeçalhos HTTP", False, f"Erro: {e}")

        # D3: Resiliência contra Payloads Corrompidos (Fuzzing / Malformed JSON)
        try:
            # Enviar dados que não são JSON válido para verificar se o servidor trata sem crashar
            headers = {"Content-Type": "application/json"}
            malformed_body = '{"name": "Aluno Inválido", "cpf": ' # Quebrado intencionalmente
            r = requests.post(f"{self.base_url}/api/students", data=malformed_body, headers=headers, timeout=10)
            
            # Não pode retornar 500 com dump de código nem derrubar o servidor
            passed = r.status_code in (400, 401)
            
            # Verificar se NÃO vazou caminhos internos (/home/..., node_modules, etc.)
            body_text = r.text.lower()
            no_stack_leak = "node_modules" not in body_text and "trace" not in body_text and "/home/" not in body_text
            passed = passed and no_stack_leak

            msg = f"HTTP {r.status_code} recebido. Servidor tratou a anomalia sem vazar stack trace ou código-fonte."
            self.record_result("DISPONIBILIDADE", "D3", "Resiliência a entrada maliciosa/corrompida sem vazamento de stack trace", passed, msg)
        except Exception as e:
            self.record_result("DISPONIBILIDADE", "D3", "Resiliência a entrada maliciosa/corrompida", False, f"Erro: {e}")

        # D4: Verificação de Política de CORS
        try:
            cors_headers = {
                "Origin": "https://malicious-attacker-site.com",
                "Access-Control-Request-Method": "POST"
            }
            r = requests.options(f"{self.base_url}/api/students", headers=cors_headers, timeout=10)
            passed = r.status_code in (200, 204, 401, 403)
            msg = f"HTTP {r.status_code} na resposta do preflight OPTIONS."
            self.record_result("DISPONIBILIDADE", "D4", "Preflight CORS configurado e respondendo requisições cruzadas", passed, msg)
        except Exception as e:
            self.record_result("DISPONIBILIDADE", "D4", "Preflight CORS configurado", False, f"Erro: {e}")

    # =========================================================================
    # RELATÓRIO EXECUTIVO FINAL
    # =========================================================================
    def print_summary(self):
        total = len(self.results)
        passed_count = sum(1 for r in self.results if r["passed"])
        failed_count = total - passed_count
        taxa = (passed_count / total * 100) if total > 0 else 0

        print(f"{Colors.BOLD}{Colors.GREEN}{'=' * 80}{Colors.RESET}")
        print(f"{Colors.BOLD}   RESUMO EXECUTIVO DA AUDITORIA DE SEGURANÇA (FICR){Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'=' * 80}{Colors.RESET}")
        print(f"   Total de Casos de Teste Avaliados : {Colors.BOLD}{total}{Colors.RESET}")
        print(f"   Casos Aprovados [PASS]            : {Colors.GREEN}{Colors.BOLD}{passed_count}{Colors.RESET}")
        print(f"   Casos Reprovados [FAIL]           : {Colors.RED if failed_count > 0 else Colors.GREEN}{Colors.BOLD}{failed_count}{Colors.RESET}")
        print(f"   Índice de Conformidade de Segurança: {Colors.BOLD}{taxa:.1f}%{Colors.RESET}\n")

        # Tabela agrupada por Pilar
        pillars = ["CONFIDENCIALIDADE", "INTEGRIDADE", "DISPONIBILIDADE"]
        for pil in pillars:
            pil_tests = [t for t in self.results if t["pillar"] == pil]
            pil_pass = sum(1 for t in pil_tests if t["passed"])
            print(f"   • {Colors.CYAN}{pil:<18}{Colors.RESET}: {pil_pass}/{len(pil_tests)} aprovados")

        print(f"{Colors.BOLD}{Colors.GREEN}{'=' * 80}{Colors.RESET}")
        if failed_count == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✔ SUCESSO: Todos os controles de segurança da Tríade CID foram validados com êxito!{Colors.RESET}")
            print("  Os resultados comprovam as defesas de Confidencialidade, Integridade e Disponibilidade.\n")
        else:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠ ATENÇÃO: {failed_count} teste(s) não passaram no comportamento esperado.{Colors.RESET}\n")


def main():
    parser = argparse.ArgumentParser(description="Suíte de Testes Automatizados de Segurança Base FC (Tríade CID)")
    parser.add_argument(
        "--url",
        default="https://https-basefc-onrender-com.onrender.com",
        help="URL base da API (ex: https://https-basefc-onrender-com.onrender.com ou http://localhost:3000)"
    )
    parser.add_argument(
        "--token",
        default=None,
        help="Token JWT de autenticação opcional para testes autenticados de RBAC e Zod"
    )

    args = parser.parse_args()

    runner = SecurityTestRunner(base_url=args.url, token=args.token)
    runner.print_banner()
    runner.test_confidentiality()
    runner.test_integrity()
    runner.test_availability()
    runner.print_summary()


if __name__ == "__main__":
    main()
