import React from 'react'

interface FinancialBlockProps {
  templateCode: string
  options: any
}

export const FinancialBlock = React.memo(({ templateCode, options }: FinancialBlockProps) => {
  if (templateCode === 'LIMITE_CREDITO_BB') {
    const annualRev = options.annualRevenue || 0
    const annualExp = options.annualExpenses || 0
    const debts = options.existingDebts || 0
    const netCapacity = Math.max(0, annualRev - annualExp - debts)

    return (
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
          V - Resumo de Capacidade de Pagamento e Viabilidade (Estimativa)
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div><strong>Receita Bruta Anual:</strong> R$ {annualRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div><strong>Despesas Operacionais:</strong> R$ {annualExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div><strong>Dívidas Preexistentes (Amortização Anual):</strong> R$ {debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div>
            <strong>Capacidade de Pagamento Líquida Estimada:</strong> 
            <span style={{ color: netCapacity > 0 ? '#1B4D3E' : '#dc2626', fontWeight: 'bold' }}>
              R$ {netCapacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const isProject = ['PROJETO_INOVAGRO', 'PROJETO_RENOVAGRO', 'PROJETO_CUSTEIO_SAFRA'].includes(templateCode)
  if (!isProject) return null

  const total = options.totalInvestment || (options.cropAreaHa * options.costPerHa) || 0
  const financed = options.financedAmount || total
  const ownRes = options.ownResources || (total - financed)

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
      <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
        III - Quadro Financeiro e Condições de Financiamento
      </div>
      <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {templateCode !== 'PROJETO_CUSTEIO_SAFRA' && (
          <>
            <div><strong>Investimento Total Projetado:</strong> R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div><strong>Recursos Próprios (Contrapartida):</strong> R$ {ownRes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </>
        )}
        <div><strong>Valor Financiado Solicitado:</strong> R$ {financed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        
        {templateCode !== 'PROJETO_CUSTEIO_SAFRA' ? (
          <div><strong>Prazo Total:</strong> {options.termYears || 0} anos ({options.graceMonths || 0} meses de carência)</div>
        ) : (
          <div><strong>Ciclo / Prazo:</strong> Conforme ciclo da cultura</div>
        )}
        
        <div><strong>Taxa de Juros Anual:</strong> {options.interestRate ? `${options.interestRate.toFixed(1)}% a.a.` : '-'}</div>
        
        {templateCode === 'PROJETO_INOVAGRO' && (
          <div><strong>Economia Mensal Estimada:</strong> R$ {(options.estimatedMonthlySavings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        )}
        {templateCode === 'PROJETO_CUSTEIO_SAFRA' && (
          <div><strong>Receita Bruta Estimada:</strong> R$ {((options.expectedYieldScHa || 0) * (options.pricePerSc || 0) * (options.cropAreaHa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        )}
      </div>
    </div>
  )
})
FinancialBlock.displayName = 'FinancialBlock'
