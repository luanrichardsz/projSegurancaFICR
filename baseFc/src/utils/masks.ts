/**
 * Utilitários para Máscaras, Sanitização e Validação de Entradas
 * Sistema Base FC - Foco em Integridade de Dados e OWASP Input Validation
 */

/**
 * Remove todos os caracteres que não sejam dígitos numéricos.
 * Garante que dados como CPF e Telefone sejam enviados e salvos no banco de dados
 * limpos, sem formatação (pontos, traços, parênteses).
 */
export const unmask = (value: string | null | undefined): string => {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
};

/**
 * Aplica máscara de CPF: 000.000.000-00
 * Limita a 11 dígitos numéricos (14 caracteres formatados).
 */
export const maskCPF = (value: string | null | undefined): string => {
  const digits = unmask(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

/**
 * Aplica máscara de Telefone celular ou fixo:
 * 11 dígitos: (00) 00000-0000
 * 10 dígitos: (00) 0000-0000
 */
export const maskPhone = (value: string | null | undefined): string => {
  const digits = unmask(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Aplica máscara de CEP: 00000-000
 */
export const maskCEP = (value: string | null | undefined): string => {
  const digits = unmask(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/**
 * Validação do algoritmo oficial de CPF (módulo 11)
 * Previne inserção de CPFs inválidos ou sequências fictícias (ex: 111.111.111-11).
 */
export const isValidCPF = (cpf: string | null | undefined): boolean => {
  const clean = unmask(cpf);
  if (clean.length !== 11) return false;

  // Rejeita sequências repetidas conhecidas
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let check1 = 11 - (sum % 11);
  if (check1 >= 10) check1 = 0;
  if (check1 !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  let check2 = 11 - (sum % 11);
  if (check2 >= 10) check2 = 0;
  return check2 === parseInt(clean.charAt(10));
};

/**
 * Validação de Telefone (DDD + 8 ou 9 dígitos)
 */
export const isValidPhone = (phone: string | null | undefined): boolean => {
  const clean = unmask(phone);
  return clean.length === 10 || clean.length === 11;
};
