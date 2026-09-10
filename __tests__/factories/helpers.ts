/**
 * Geradores auxiliares de CPF e CNPJ matematicamente válidos e inválidos
 * baseados no algoritmo oficial de Módulo 11 (especificação RF-CRM-002 e RF-CRM-003).
 */

export function generateValidCPF(): string {
  const rnd = () => Math.floor(Math.random() * 9)
  const digits = Array.from({ length: 9 }, rnd)
  
  // Evitar sequências repetidas
  if (digits.every(d => d === digits[0])) {
    digits[0] = (digits[0] + 1) % 9
  }

  // 1º Dígito Verificador
  let sum1 = 0
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * (10 - i)
  }
  const rem1 = sum1 % 11
  const d1 = rem1 < 2 ? 0 : 11 - rem1
  digits.push(d1)

  // 2º Dígito Verificador
  let sum2 = 0
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * (11 - i)
  }
  const rem2 = sum2 % 11
  const d2 = rem2 < 2 ? 0 : 11 - rem2
  digits.push(d2)

  return digits.join('')
}

export function generateValidCNPJ(): string {
  const rnd = () => Math.floor(Math.random() * 9)
  // Raiz de 8 dígitos + filial 0001
  const digits = [...Array.from({ length: 8 }, rnd), 0, 0, 0, 1]

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    sum1 += digits[i] * weights1[i]
  }
  const rem1 = sum1 % 11
  const d1 = rem1 < 2 ? 0 : 11 - rem1
  digits.push(d1)

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum2 = 0
  for (let i = 0; i < 13; i++) {
    sum2 += digits[i] * weights2[i]
  }
  const rem2 = sum2 % 11
  const d2 = rem2 < 2 ? 0 : 11 - rem2
  digits.push(d2)

  return digits.join('')
}
