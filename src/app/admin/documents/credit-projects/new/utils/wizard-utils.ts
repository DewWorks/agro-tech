export function formatCPF(v?: string) {
  if (!v) return ''
  const c = v.replace(/\D/g, '')
  if (c.length !== 11) return v
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(v?: string) {
  if (!v) return ''
  const c = v.replace(/\D/g, '')
  if (c.length !== 14) return v
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
