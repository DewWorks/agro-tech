/**
 * Valida o número de CPF utilizando o algoritmo de Modulo 11.
 * @param cpf string contendo o CPF, com ou sem máscara
 * @returns boolean indicando se o CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false

  const values = cpf.split('').map(Number)
  const checkDigit1 = calculateMod11(values.slice(0, 9), 10)
  const checkDigit2 = calculateMod11(values.slice(0, 10), 11)

  return checkDigit1 === values[9] && checkDigit2 === values[10]
}

/**
 * Valida o número de CNPJ utilizando o algoritmo de Modulo 11.
 * @param cnpj string contendo o CNPJ, com ou sem máscara
 * @returns boolean indicando se o CNPJ é válido
 */
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false

  const values = cnpj.split('').map(Number)
  
  // Pesos para o primeiro dígito: 5,4,3,2,9,8,7,6,5,4,3,2
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const checkDigit1 = calculateCNPJMod11(values.slice(0, 12), weights1)
  
  // Pesos para o segundo dígito: 6,5,4,3,2,9,8,7,6,5,4,3,2
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const checkDigit2 = calculateCNPJMod11(values.slice(0, 13), weights2)

  return checkDigit1 === values[12] && checkDigit2 === values[13]
}

function calculateMod11(digits: number[], initialWeight: number): number {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (initialWeight - i)
  }
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function calculateCNPJMod11(digits: number[], weights: number[]): number {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weights[i]
  }
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}
