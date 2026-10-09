import {
  calculateAmortization,
  calculatePaymentCapacity,
  calculatePaymentCapacityAndIcsd,
  calculateCollateralAndLtv,
  evaluateMcrCompliance,
  calculateFullCreditRiskAnalysis,
  AmortizationSystem,
  CreditLineAxis,
  AgroActivityType,
  RevenueRealizationType,
  ExpenseCategory,
  UrbanPropertyType,
  VehicleType
} from '@/lib/financial-engine'
import { sanitizeAccessRoute, formatGlebaRoteiro } from '@/lib/document-templates/limite-credito-bb/formatters'
import { CREDIT_LINES_CATALOG } from '@/constants/credit-lines'

describe('Motor Financeiro e Risco Bancário (Aditivo 003)', () => {
  describe('1. Algoritmos de Amortização (PRICE e SAC)', () => {
    it('calcula operação de custeio agrícola de safra única (12 meses)', () => {
      const res = calculateAmortization(500000, 10.0, 12, 0, AmortizationSystem.PRICE)

      expect(res.principal).toBe(500000)
      expect(res.annualDebtService).toBe(550000) // 500k + 10%
      expect(res.totalInterestPaid).toBe(50000)
      expect(res.schedule).toHaveLength(1)
      expect(res.schedule[0].closingBalance).toBe(0)
    })

    it('calcula financiamento de investimento no Sistema PRICE (5 anos, sem carência)', () => {
      const res = calculateAmortization(1000000, 10.0, 60, 0, AmortizationSystem.PRICE)

      expect(res.principal).toBe(1000000)
      expect(res.schedule).toHaveLength(5)
      // Prestação constante: PMT = 1.000.000 * (0.1 * 1.1^5 / (1.1^5 - 1)) ~ 263.797,48
      expect(res.annualDebtService).toBeCloseTo(263797.48, 1)
      expect(res.schedule[4].closingBalance).toBe(0)
      expect(res.totalAmountPaid).toBeGreaterThan(1000000)
    })

    it('calcula financiamento de investimento no Sistema PRICE com carência de 24 meses', () => {
      const res = calculateAmortization(1000000, 10.0, 96, 24, AmortizationSystem.PRICE)

      expect(res.schedule).toHaveLength(8) // 8 anos total
      expect(res.schedule[0].isGracePeriod).toBe(true)
      expect(res.schedule[0].amortization).toBe(0)
      expect(res.schedule[0].interest).toBe(100000) // 10% de juros pagos na carência
      expect(res.schedule[1].isGracePeriod).toBe(true)
      expect(res.schedule[2].isGracePeriod).toBe(false)
      expect(res.schedule[7].closingBalance).toBe(0)
    })

    it('calcula financiamento no Sistema SAC e define o Ano 1 pós-carência como estresse de dívida', () => {
      // 1.000.000 em 5 anos (60 meses), 10% a.a.
      // Amortização constante: 200.000/ano
      // Ano 1: Amortização 200k + Juros 100k = 300k
      // Ano 2: Amortização 200k + Juros 80k = 280k
      const res = calculateAmortization(1000000, 10.0, 60, 0, AmortizationSystem.SAC)

      expect(res.system).toBe(AmortizationSystem.SAC)
      expect(res.annualDebtService).toBe(300000) // Maior encargo
      expect(res.schedule[0].totalPayment).toBe(300000)
      expect(res.schedule[1].totalPayment).toBe(280000)
      expect(res.schedule[4].closingBalance).toBe(0)
    })
  })

  describe('2. Capacidade de Pagamento e ICSD (Índice de Cobertura do Serviço da Dívida)', () => {
    it('aprova proposta com margem confortável quando ICSD >= 1.30', () => {
      const res = calculatePaymentCapacityAndIcsd(
        [
          {
            description: 'Soja Grãos (Safra Vigente)',
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            quantity: 10000,
            unit: 'sc',
            unitPrice: 120, // 1.200.000
            productionCostTotal: 600000 // Lucro 600.000
          }
        ],
        [
          {
            description: 'Consultoria Agronômica Externa',
            annualAmount: 100000
          }
        ],
        [
          {
            category: ExpenseCategory.MANUTENCAO_FAMILIAR,
            description: 'Manutenção Familiar Anual',
            annualAmount: 120000
          },
          {
            category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO,
            description: 'Custeio em aberto Sicredi',
            annualAmount: 80000
          }
        ],
        300000 // Parcela anual de dívida nova
      )

      // Total Líquido Inflows: 600k + 100k = 700k
      // Total Despesas: 120k + 80k = 200k
      // CP = 500k
      // ICSD = 500k / 300k = 1.67
      expect(res.grossAgroRevenue).toBe(1200000)
      expect(res.netAgroRevenue).toBe(600000)
      expect(res.paymentCapacity).toBe(500000)
      expect(res.icsdValue).toBe(1.67)
      expect(res.classification).toBe('APROVADO_CONFORTAVEL')
      expect(res.isApproved).toBe(true)
    })

    it('aprova com alerta quando 1.20 <= ICSD < 1.30', () => {
      // CP = 370k, Parcela = 300k -> ICSD = 1.23
      const res = calculatePaymentCapacityAndIcsd(
        [
          {
            description: 'Bovinocultura de Corte',
            activityType: AgroActivityType.PECUARIA_CORTE,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            quantity: 200,
            unit: 'cab',
            unitPrice: 3500, // 700.000
            productionCostTotal: 250000 // Líquido 450.000
          }
        ],
        [],
        [
          {
            category: ExpenseCategory.MANUTENCAO_FAMILIAR,
            description: 'Despesas Pessoais',
            annualAmount: 80000
          }
        ],
        300000 // 370k / 300k = 1.23
      )

      expect(res.paymentCapacity).toBe(370000)
      expect(res.icsdValue).toBe(1.23)
      expect(res.classification).toBe('APROVADO_ALERTA')
      expect(res.isApproved).toBe(true)
    })

    it('reprova proposta quando ICSD < 1.20', () => {
      // CP = 300k, Parcela = 300k -> ICSD = 1.00 < 1.20
      const res = calculatePaymentCapacityAndIcsd(
        [
          {
            description: 'Milho Safrinha',
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            quantity: 5000,
            unit: 'sc',
            unitPrice: 80, // 400.000
            productionCostTotal: 100000 // Líquido 300.000
          }
        ],
        [],
        [],
        300000
      )

      expect(res.icsdValue).toBe(1.0)
      expect(res.classification).toBe('REPROVADO')
      expect(res.isApproved).toBe(false)
    })

    it('reprova sumariamente quando a Capacidade de Pagamento é negativa ou zerada', () => {
      const res = calculatePaymentCapacityAndIcsd(
        [
          {
            description: 'Safra Pequena',
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            quantity: 1000,
            unit: 'sc',
            unitPrice: 50, // 50.000
            productionCostTotal: 80000 // Prejuízo operacional
          }
        ],
        [],
        [
          {
            category: ExpenseCategory.MANUTENCAO_FAMILIAR,
            description: 'Custo Familiar',
            annualAmount: 60000
          }
        ],
        50000
      )

      expect(res.paymentCapacity).toBe(-60000)
      expect(res.isApproved).toBe(false)
      expect(res.classification).toBe('REPROVADO')
    })
  })

  describe('3. Ponderação de Garantias e Loan-to-Value (LTV MCR)', () => {
    it('aplica corretamente os pesos regulamentares MCR (65% terra, 50% penhor, 50% urbano, 40% veículos)', () => {
      const res = calculateCollateralAndLtv(
        500000,
        {
          landValue: 1000000,       // 65% -> 650.000
          improvementsValue: 200000,// 65% -> 130.000
          machineryValue: 200000,   // 50% -> 100.000
          livestockValue: 100000    // 50% -> 50.000
        },
        [
          {
            description: 'Apartamento Goiânia',
            propertyType: UrbanPropertyType.RESIDENCIAL,
            marketValue: 400000,    // 50% -> 200.000
            hasLien: false
          }
        ],
        [
          {
            brand: 'Toyota',
            model: 'Hilux SRX',
            vehicleType: VehicleType.CAMINHONETE,
            declaredValue: 250000,  // 40% -> 100.000
            hasLien: false
          }
        ]
      )

      // Total declarado: 1.200.000 (rural) + 300.000 (penhor) + 400.000 (urbano) + 250.000 (veículo) = 2.150.000
      // Rural aceitável: (1.2M * 0.65) + (300k * 0.50) = 780.000 + 150.000 = 930.000
      // Urbano aceitável: 200.000
      // Veículos aceitável: 100.000
      // Total aceitável: 930k + 200k + 100k = 1.230.000
      expect(res.totalDeclaredCollateral).toBe(2150000)
      expect(res.ruralAcceptable).toBe(930000)
      expect(res.urbanAcceptable).toBe(200000)
      expect(res.vehiclesAcceptable).toBe(100000)
      expect(res.totalAcceptableCollateral).toBe(1230000)
      expect(res.isApproved).toBe(true) // 1.230.000 >= 500.000
      expect(res.coverageRatioPercent).toBe(246) // 1.23M / 500k
    })

    it('desconsidera bens com gravame/alienação fiduciária do lastro aceitável', () => {
      const res = calculateCollateralAndLtv(
        200000,
        {
          landValue: 0,
          improvementsValue: 0,
          machineryValue: 0,
          livestockValue: 0
        },
        [
          {
            description: 'Casa Gravada Caixa',
            propertyType: UrbanPropertyType.RESIDENCIAL,
            marketValue: 500000,
            hasLien: true // Alienada
          }
        ],
        [
          {
            brand: 'John Deere',
            model: 'Trator 6110J',
            vehicleType: VehicleType.TRATOR_UTILITARIO,
            declaredValue: 300000,
            hasLien: true // Alienado
          }
        ]
      )

      expect(res.totalDeclaredCollateral).toBe(800000)
      expect(res.totalAcceptableCollateral).toBe(0)
      expect(res.isApproved).toBe(false)
    })
  })

  describe('4. Compliance MCR e Orquestração Global', () => {
    it('executa a análise completa e retorna status APROVADO para cliente com bom fluxo e garantias', () => {
      const res = calculateFullCreditRiskAnalysis({
        requestedAmount: 400000,
        termMonths: 60,
        graceMonths: 12,
        annualInterestRate: 10.5,
        amortizationSystem: AmortizationSystem.PRICE,
        creditLineAxis: CreditLineAxis.INVESTIMENTO,
        creditLineCode: 'RENOVAGRO_RECUPERACAO',
        creditLineName: 'Programa RenovAgro',
        agroRevenues: [
          {
            description: 'Soja safra',
            activityType: AgroActivityType.AGRICOLA_GRAOS,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            quantity: 8000,
            unit: 'sc',
            unitPrice: 130, // 1.040.000
            productionCostTotal: 500000 // 540.000 líquido
          }
        ],
        expenses: [
          {
            category: ExpenseCategory.MANUTENCAO_FAMILIAR,
            description: 'Manutenção Familiar',
            annualAmount: 100000
          }
        ],
        ruralCollateral: {
          landValue: 1500000,
          improvementsValue: 200000,
          machineryValue: 300000,
          livestockValue: 0
        }
      })

      expect(res.overallStatus).toBe('APROVADO')
      expect(res.icsd.isApproved).toBe(true)
      expect(res.ltv.isApproved).toBe(true)
      expect(res.regulatoryNotes.some((n) => n.includes('RenovAgro'))).toBe(true)
    })
  })

  describe('5. Unificação da Fórmula da Capacidade de Pagamento (Cláusula 2.2 do Aditivo 003)', () => {
    it('calcula rigorosamente a CP sem dupla dedução de custos e somando receitas efetiva e projetada', () => {
      // Cenário exato homologado da Fazenda do João (prints do CRM / Simulador):
      // Receita Efetiva: 150.000,00
      // Receita Projetada: 200.000,00
      // Custos Operacionais: 10.000,00
      // Outras Receitas: 7.000,00
      // Custo de Vida Familiar: 4.500,00
      // Dívidas Bancárias Vigentes: 2.000,00
      const cp = calculatePaymentCapacity({
        effectiveAgroRevenue: 150000,
        projectedAgroRevenue: 200000,
        operationalExpenses: 10000,
        nonAgroRevenues: 7000,
        familyLivingCosts: 4500,
        existingDebtService: 2000,
      })

      // Receita Bruta Agro: 150k + 200k = 350k
      expect(cp.grossAgroRevenue).toBe(350000)
      // Receita Líquida Agro = 350k - 10k = 340k
      expect(cp.netAgroRevenue).toBe(340000)
      // Total Entradas Líquidas = 340k + 7k = 347k
      expect(cp.totalNetInflows).toBe(347000)
      // Total Encargos Familiares e Passivos = 4.5k + 2k = 6.5k
      expect(cp.totalLivingAndDebtExpenses).toBe(6500)
      // Despesas Totais (Operacionais + Familiares + Passivos) = 16.5k
      expect(cp.totalExpenses).toBe(16500)
      // CP = 347k - 6.5k = 340.500,00
      expect(cp.paymentCapacity).toBe(340500)
      expect(cp.isPositive).toBe(true)
    })

    it('reconcilia perfeitamente o resultado entre o motor puro e o orquestrador ICSD', () => {
      const icsd = calculatePaymentCapacityAndIcsd(
        [
          {
            description: 'Receita Safra Anterior',
            quantity: 1,
            unit: 'un',
            unitPrice: 150000,
            productionCostTotal: 0,
            realizationType: RevenueRealizationType.EFETIVA_HISTORICA,
            activityType: AgroActivityType.AGRICOLA_GRAOS,
          },
          {
            description: 'Receita Safra Vigente',
            quantity: 1,
            unit: 'un',
            unitPrice: 200000,
            productionCostTotal: 10000,
            realizationType: RevenueRealizationType.PROJETADA_SAFRA,
            activityType: AgroActivityType.AGRICOLA_GRAOS,
          },
        ],
        [{ description: 'Outras Rendas', annualAmount: 7000 }],
        [
          { category: ExpenseCategory.MANUTENCAO_FAMILIAR, description: 'Manutenção Familiar', annualAmount: 4500 },
          { category: ExpenseCategory.PASSIVO_EXISTENTE_BANCARIO, description: 'Dívidas Bancárias', annualAmount: 2000 },
        ],
        100000 // Parcela anual de dívida
      )

      expect(icsd.paymentCapacity).toBe(340500)
      expect(icsd.totalNetInflows).toBe(347000)
      expect(icsd.totalExpenses).toBe(6500)
      expect(icsd.icsdValue).toBe(3.41) // 340.500 / 100.000 = 3.405 -> 3.41
      expect(icsd.isApproved).toBe(true)
    })
  })

  describe('6. Sanitização de Rota de Acesso Duplicada (Folha 01 PDF)', () => {
    it('elimina concatenações duplicadas com o mesmo texto repetido', () => {
      const duplicated = 'Partindo de Palmas pela TO-050 por 45km. Partindo de Palmas pela TO-050 por 45km.'
      const sanitized = sanitizeAccessRoute(duplicated)
      expect(sanitized).toBe('Partindo de Palmas pela TO-050 por 45km.')
    })

    it('elimina duplicação colada direta sem separador', () => {
      const glued = 'Partindo de Palmas pela TO-050 por 45kmPartindo de Palmas pela TO-050 por 45km'
      const sanitized = sanitizeAccessRoute(glued)
      expect(sanitized).toBe('Partindo de Palmas pela TO-050 por 45km')
    })

    it('elimina fragmento colado no início (45kmPartindo...)', () => {
      const gluedFragment = '45kmPartindo de Palmas pela TO-050 por 45km'
      const sanitized = sanitizeAccessRoute(gluedFragment)
      expect(sanitized).toBe('Partindo de Palmas pela TO-050 por 45km')
    })

    it('formata gleba e roteiro com separador e deduplicação inteligente', () => {
      expect(formatGlebaRoteiro('Gleba 01', 'Partindo de Palmas pela TO-050 por 45km')).toBe(
        'Gleba 01 • Partindo de Palmas pela TO-050 por 45km'
      )
      expect(
        formatGlebaRoteiro(
          'Partindo de Palmas pela TO-050 por 45km',
          'Partindo de Palmas pela TO-050 por 45km'
        )
      ).toBe('Partindo de Palmas pela TO-050 por 45km')
      expect(
        formatGlebaRoteiro(
          undefined,
          'Partindo de Palmas pela TO-050 por 45kmPartindo de Palmas pela TO-050 por 45km'
        )
      ).toBe('Partindo de Palmas pela TO-050 por 45km')
    })

    it('preserva rotas válidas e normais sem duplicação', () => {
      const normal = 'Partindo de Palmas pela TO-050 por 45 km sentido Porto Nacional, virar à direita na Rodovia TO-255.'
      expect(sanitizeAccessRoute(normal)).toBe(normal)
    })

    it('retorna texto padrão quando rota estiver vazia ou nula', () => {
      expect(sanitizeAccessRoute('')).toBe('Acesso principal via rodovia estadual/municipal transitável o ano todo.')
      expect(sanitizeAccessRoute(null)).toBe('Acesso principal via rodovia estadual/municipal transitável o ano todo.')
    })
  })

  describe('7. Catálogo das 15 Linhas Oficiais do Plano Safra (Aditivo 003)', () => {
    it('contém exatamente as 15 linhas regulamentadas com taxas e prazos de referência', () => {
      expect(CREDIT_LINES_CATALOG.length).toBeGreaterThanOrEqual(15)

      const requiredCodes = [
        'PRONAMP_CUSTEIO',
        'PRONAF_MAIS_ALIMENTOS_FIXO',
        'PRONAF_MAIS_ALIMENTOS_SEMIFIXO',
        'PRONAF_MULHER',
        'PRONAF_JOVEM',
        'PRONAF_B',
        'PRONAF_AGROINDUSTRIA',
        'PRONAF_AGROECOLOGIA',
        'PRONAF_BIOECONOMIA',
        'PRONAF_A_AC',
        'RENOVAGRO',
        'INOVAGRO',
        'MODERFROTA',
        'INVESTE_AGRO',
        'PCA',
      ]

      for (const code of requiredCodes) {
        const found = CREDIT_LINES_CATALOG.find((l) => l.code === code)
        expect(found).toBeDefined()
        expect(found?.defaultInterestRate).toBeGreaterThan(0)
        expect(found?.defaultTermMonths).toBeGreaterThan(0)
      }
    })

    it('valida o teto regulamentar de R$ 1.500.000 do PRONAMP Custeio', () => {
      const compOver = evaluateMcrCompliance('PRONAMP_CUSTEIO', CreditLineAxis.CUSTEIO, 2000000, true, true)
      expect(compOver.warnings.some((w) => w.includes('1.500.000'))).toBe(true)

      const compUnder = evaluateMcrCompliance('PRONAMP_CUSTEIO', CreditLineAxis.CUSTEIO, 1200000, true, true)
      expect(compUnder.warnings.some((w) => w.includes('1.500.000'))).toBe(false)
    })
  })
})
