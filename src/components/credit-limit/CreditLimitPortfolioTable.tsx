'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Building2,
  Wheat,
  Beef,
  Tractor,
  Sprout,
  Scale,
  CreditCard,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Coins,
  BookOpen,
} from 'lucide-react'
import { CreditLimitPropertyItem } from '@/actions/credit-limit'
import { formatCPF, formatCNPJ } from '@/lib/utils'

interface CreditLimitPortfolioTableProps {
  initialProperties: CreditLimitPropertyItem[]
  branches: { id: string; name: string }[]
}

const PURPOSE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  CUSTEIO_AGRICOLA: {
    label: 'Custeio Agrícola (Safra)',
    icon: Wheat,
    color: 'text-amber-600 dark:text-amber-400',
  },
  CUSTEIO_PECUARIO: {
    label: 'Custeio Pecuário / Nutrição',
    icon: Beef,
    color: 'text-rose-600 dark:text-rose-400',
  },
  INVESTIMENTO_MAQUINAS: {
    label: 'Investimento (Tratores & Máquinas)',
    icon: Tractor,
    color: 'text-blue-600 dark:text-blue-400',
  },
  INVESTIMENTO_SOLO_PASTAGEM: {
    label: 'Reforma de Pastagens & Calagem',
    icon: Sprout,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  RETENCAO_MATRIZES: {
    label: 'Retenção de Matrizes & Bezerros',
    icon: Scale,
    color: 'text-purple-600 dark:text-purple-400',
  },
  MISTO: {
    label: 'Limite Misto / Rotativo de Crédito',
    icon: CreditCard,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
}

const BANK_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  BANCO_DO_BRASIL: { label: 'Banco do Brasil', icon: Landmark },
  SICREDI: { label: 'Sicredi', icon: Building2 },
  SICOOB: { label: 'Sicoob', icon: Building2 },
  BRADESCO_AGRO: { label: 'Bradesco Agro', icon: Landmark },
  CAIXA_ECONOMICA: { label: 'Caixa Econômica', icon: Landmark },
  OUTRO: { label: 'Outro Banco', icon: Building2 },
}

export function CreditLimitPortfolioTable({
  initialProperties,
  branches,
}: CreditLimitPortfolioTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('TODOS')
  const [selectedPurpose, setSelectedPurpose] = useState('TODOS')
  const [selectedBank, setSelectedBank] = useState('TODOS')
  const [selectedStatus, setSelectedStatus] = useState('TODOS')

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const filteredProperties = useMemo(() => {
    return initialProperties.filter((item) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.propertyName && item.propertyName.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        item.primaryProducerName.toLowerCase().includes(q)

      const matchesBranch =
        selectedBranch === 'TODOS' || item.branchId === selectedBranch
      const matchesPurpose =
        selectedPurpose === 'TODOS' || item.creditLimitPurpose === selectedPurpose
      const matchesBank =
        selectedBank === 'TODOS' || item.creditLimitTargetBank === selectedBank
      const matchesStatus =
        selectedStatus === 'TODOS' || item.status === selectedStatus

      return matchesSearch && matchesBranch && matchesPurpose && matchesBank && matchesStatus
    })
  }, [
    initialProperties,
    searchTerm,
    selectedBranch,
    selectedPurpose,
    selectedBank,
    selectedStatus,
  ])

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por propriedade, produtor ou município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50/70 dark:bg-slate-800/40"
          />
        </div>

        {/* Filtro de Filial */}
        {branches.length > 0 && (
          <div className="w-full md:w-48">
            <Select value={selectedBranch} onValueChange={(val) => setSelectedBranch(val || 'TODOS')}>
              <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                <SelectValue placeholder="Todas as Filiais">
                  {selectedBranch === 'TODOS' || !selectedBranch
                    ? 'Todas as Filiais'
                    : branches.find((b) => b.id === selectedBranch)?.name || 'Todas as Filiais'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                <SelectItem value="TODOS">Todas as Filiais</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filtro de Finalidade */}
        <div className="w-full md:w-56">
          <Select value={selectedPurpose} onValueChange={(val) => setSelectedPurpose(val || 'TODOS')}>
            <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Todas as Finalidades" />
            </SelectTrigger>
            <SelectContent className="min-w-[280px]">
              <SelectItem value="TODOS">Todas as Finalidades</SelectItem>
              {Object.entries(PURPOSE_META).map(([key, meta]) => {
                const Icon = meta.icon
                return (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <span>{meta.label}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Status */}
        <div className="w-full md:w-44">
          <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val || 'TODOS')}>
            <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent className="min-w-[180px]">
              <SelectItem value="TODOS">Todos os Status</SelectItem>
              <SelectItem value="COMPATIVEL">Compatível</SelectItem>
              <SelectItem value="REVISAR_PRAZO">Revisar Prazo</SelectItem>
              <SelectItem value="INCOMPATIVEL">Incompatível</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela da Carteira de Limites */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Carteira de Limites por Imóvel Rural
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exibindo {filteredProperties.length} de {initialProperties.length} propriedades cadastradas.
            </p>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Coins className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-1" />
            <p className="font-semibold">Nenhuma propriedade encontrada com os filtros selecionados.</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Tente redefinir os filtros ou realize novas análises no cadastro de propriedades rurais.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold">
                  <TableHead className="w-[220px]">Propriedade & Local</TableHead>
                  <TableHead className="w-[180px]">Produtor(a)</TableHead>
                  <TableHead className="w-[200px]">Finalidade & Banco</TableHead>
                  <TableHead className="w-[140px] text-right">Limite Solicitado</TableHead>
                  <TableHead className="w-[140px] text-right">Garantias (MCR)</TableHead>
                  <TableHead className="w-[140px] text-right">Margem Líquida</TableHead>
                  <TableHead className="w-[120px] text-center">Diagnóstico</TableHead>
                  <TableHead className="w-[90px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((prop) => {
                  const purposeMeta = PURPOSE_META[prop.creditLimitPurpose] || PURPOSE_META.CUSTEIO_AGRICOLA
                  const PurposeIcon = purposeMeta.icon
                  const bankMeta = BANK_META[prop.creditLimitTargetBank] || BANK_META.BANCO_DO_BRASIL
                  const BankIcon = bankMeta.icon

                  return (
                    <TableRow key={prop.id} className="text-xs hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      {/* Coluna 1: Propriedade & Local */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {prop.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {prop.city ? `${prop.city}/${prop.state || 'UF'}` : 'Sem município'} •{' '}
                            {prop.totalArea.toFixed(1)} ha
                          </span>
                        </div>
                      </TableCell>

                      {/* Coluna 2: Produtor(a) */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {prop.primaryProducerName}
                          </span>
                          {prop.primaryProducerDocument && (
                            <span className="text-[10.5px] font-mono text-slate-400">
                              {prop.primaryProducerDocument.length > 11
                                ? formatCNPJ(prop.primaryProducerDocument)
                                : formatCPF(prop.primaryProducerDocument)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Coluna 3: Finalidade & Banco */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <PurposeIcon className={`w-3.5 h-3.5 shrink-0 ${purposeMeta.color}`} />
                            <span className="truncate">{purposeMeta.label}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[10.5px] text-slate-500">
                            <BankIcon className="w-3 h-3 shrink-0 text-slate-400" />
                            <span>{bankMeta.label}</span>
                          </span>
                        </div>
                      </TableCell>

                      {/* Coluna 4: Limite Solicitado */}
                      <TableCell className="text-right">
                        {prop.creditLimitRequested > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {formatBRL(prop.creditLimitRequested)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {prop.creditLimitTermMonths} meses
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Não simulado</span>
                        )}
                      </TableCell>

                      {/* Coluna 5: Garantias Ofertáveis */}
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {formatBRL(prop.totalCollateralLimit)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Imóvel: {formatBRL(prop.realEstateCollateral)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Coluna 6: Margem Líquida */}
                      <TableCell className="text-right">
                        {prop.hasFinancialData ? (
                          <span
                            className={`font-mono font-semibold ${
                              prop.netMargin >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatBRL(prop.netMargin)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pendente</span>
                        )}
                      </TableCell>

                      {/* Coluna 7: Diagnóstico */}
                      <TableCell className="text-center">
                        {prop.status === 'COMPATIVEL' ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Compatível
                          </Badge>
                        ) : prop.status === 'REVISAR_PRAZO' ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-bold"
                          >
                            <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                            Revisar Prazo
                          </Badge>
                        ) : prop.status === 'INCOMPATIVEL' ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold"
                          >
                            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                            Incompatível
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]"
                          >
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>

                      {/* Coluna 8: Ações */}
                      <TableCell className="text-center">
                        <Link href={`/admin/crm/properties/${prop.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-[#1B4D3E] hover:text-[#13382D] hover:bg-emerald-50"
                            title="Abrir Análise de Limite no Wizard"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Box Informativo: Diretrizes do Manual de Crédito Rural (MCR) */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start gap-3.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#1B4D3E] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            Diretrizes do Manual de Crédito Rural (MCR) & Bancos Operadores
          </h4>
          <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
            • <strong>Custeio Agrícola e Pecuário:</strong> Financiamento de até 100% dos custos operacionais comprovados ou teto de 50% da receita anual esperada.<br />
            • <strong>Garantia Imobiliária (Hipoteca / Alienação Fiduciária):</strong> Até 65% da avaliação de terra nua e benfeitorias com margem de segurança bancária de 150%.<br />
            • <strong>Garantia Pignoratícia (Penhor):</strong> Até 50% da avaliação venal de máquinas, implementos agrícolas e rebanho semovente.
          </p>
        </div>
      </div>
    </div>
  )
}
