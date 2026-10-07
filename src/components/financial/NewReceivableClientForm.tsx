'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowLeft,
  Users2,
  CheckCircle2,
  MapPin,
  User,
  Sprout,
} from 'lucide-react'
import { formatCurrency, maskCropYear } from '@/lib/utils'
import { createDirectReceivableTitle } from '@/actions/financial/receivables'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

interface NewReceivableFormProps {
  branches: Array<{ id: string; name: string; city: string }>
  producers: Array<{
    id: string
    name: string
    document: string
    properties: Array<{ id: string; name: string }>
  }>
  categories: Array<{ id: string; name: string; code: string }>
  partners: Array<{ id: string; name: string; defaultCommissionRate: any }>
  defaultBranchId?: string | null
}

const PRESETS = [
  {
    name: 'Pacote CAR Completo',
    subtype: 'Cadastro Ambiental Rural (CAR Estadual & Federal)',
    suggestedAmount: 3500.0,
    categoryCode: '1.2.01',
  },
  {
    name: 'AUI & Regularização Fundiária',
    subtype: 'Autorização de Uso e Ocupação do Imóvel (AUI / ITERTINS)',
    suggestedAmount: 5000.0,
    categoryCode: '1.2.02',
  },
  {
    name: 'Licenciamento Ambiental (NATURATINS)',
    subtype: 'Processo de Licença Ambiental Prévia e Instalação',
    suggestedAmount: 8500.0,
    categoryCode: '1.2.03',
  },
  {
    name: 'Laudo de Avaliação e VTN',
    subtype: 'Laudo Técnico de Avaliação Agronômica e Solo para Crédito',
    suggestedAmount: 4200.0,
    categoryCode: '1.2.04',
  },
]

export default function NewReceivableClientForm({
  branches,
  producers,
  categories,
  partners,
  defaultBranchId,
}: NewReceivableFormProps) {
  const router = useRouter()

  const [branchId, setBranchId] = useState<string>(
    defaultBranchId || branches[0]?.id || ''
  )
  const [producerId, setProducerId] = useState<string>(producers[0]?.id || '')
  const [propertyId, setPropertyId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '')
  const [serviceSubtype, setServiceSubtype] = useState<string>('Pacote CAR Completo')
  const [cropYear, setCropYear] = useState<string>('2025/2026')
  const [documentNumber, setDocumentNumber] = useState<string>('')

  // Valores Monetários
  const [grossAmount, setGrossAmount] = useState<number>(3500)
  const [discountAmount, setDiscountAmount] = useState<number>(0)

  // Parceiro
  const [partnerId, setPartnerId] = useState<string>('')

  // Parcelamento
  const [numInstallments, setNumInstallments] = useState<number>(1)
  const [firstDueDate, setFirstDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )

  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Propriedades do produtor selecionado
  const availableProperties = useMemo(() => {
    const prod = producers.find((p) => p.id === producerId)
    return prod?.properties || []
  }, [producers, producerId])

  // Valor Líquido
  const netAmount = Math.max(0, grossAmount - discountAmount)

  // Prévia da comissão do parceiro
  const partnerCommissionPreview = useMemo(() => {
    if (!partnerId) return null
    const partner = partners.find((p) => p.id === partnerId)
    const rate = Number(partner?.defaultCommissionRate || 20)
    const val = (netAmount * rate) / 100
    return {
      name: partner?.name || '',
      rate,
      commissionAmount: val,
    }
  }, [partnerId, partners, netAmount])

  // Grade de Parcelas computada
  const installmentsGrid = useMemo(() => {
    const count = Math.max(1, numInstallments)
    const baseAmount = Math.floor((netAmount / count) * 100) / 100
    const remainder = Math.round((netAmount - baseAmount * count) * 100) / 100

    const grid = []
    const start = new Date(firstDueDate)

    for (let i = 1; i <= count; i++) {
      const d = new Date(start)
      d.setMonth(d.getMonth() + (i - 1))

      const amount = i === 1 ? baseAmount + remainder : baseAmount
      grid.push({
        installmentNumber: i,
        totalInstallments: count,
        dueDate: d.toISOString().slice(0, 10),
        amount,
      })
    }
    return grid
  }, [numInstallments, netAmount, firstDueDate])

  // Aplicação de Preset
  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setServiceSubtype(preset.subtype)
    setGrossAmount(preset.suggestedAmount)
    setDiscountAmount(0)
    const cat = categories.find((c) => c.code === preset.categoryCode)
    if (cat) setCategoryId(cat.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!branchId || !producerId || !categoryId || netAmount <= 0) {
      toast.error('Preencha os campos obrigatórios e garanta que o valor líquido seja positivo.')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Registrando faturamento avulso...')

    try {
      const payload = {
        branchId,
        producerId,
        propertyId: propertyId || undefined,
        categoryId,
        originType: 'SERVICO_AVULSO_PACOTE' as const,
        serviceSubtype,
        documentNumber: documentNumber.trim() || undefined,
        cropYear,
        grossAmount,
        discountAmount,
        partnerId: partnerId || undefined,
        notes: notes.trim() || undefined,
        installments: installmentsGrid.map((inst) => ({
          installmentNumber: inst.installmentNumber,
          totalInstallments: inst.totalInstallments,
          dueDate: new Date(inst.dueDate).toISOString(),
          amount: inst.amount,
        })),
      }

      const res = await createDirectReceivableTitle(payload)

      if (res.error) {
        toast.dismiss(toastId)
        toast.error(res.error)
        return
      }

      toast.dismiss(toastId)
      toast.success('Faturamento registrado com sucesso! Títulos gerados.')
      router.push(`/admin/financial/receivables${branchId ? `?branchId=${branchId}` : ''}`)
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err?.message || 'Falha ao registrar faturamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Botão Voltar */}
      <div className="flex items-center gap-2">
        <Link href="/admin/financial/receivables">
          <Button variant="ghost" size="sm" type="button" className="text-slate-600 gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Contas a Receber
          </Button>
        </Link>
      </div>

      {/* Presets de Faturamento Rápido */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3">
          <Sparkles className="h-4 w-4 text-emerald-700" />
          Atalhos de Pacotes Técnicos (Preenchimento Rápido)
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="flex flex-col text-left rounded-lg border border-emerald-200 bg-white p-3 hover:border-emerald-500 hover:shadow-xs transition-all"
            >
              <span className="font-bold text-xs text-emerald-950">{p.name}</span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.subtype}</span>
              <span className="text-xs font-extrabold text-emerald-700 mt-2">
                {formatCurrency(p.suggestedAmount)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna 1 & 2: Formulário */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Filial & Produtor */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Dados do Cliente e Unidade de Atendimento
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Filial */}
              <div className="space-y-1.5">
                <Label htmlFor="branch" className="text-xs font-semibold">
                  Filial Responsável:
                </Label>
                <Select value={branchId} onValueChange={(val) => setBranchId(val || '')}>
                  <SelectTrigger id="branch" className="w-full text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Selecione a filial">
                      {(() => {
                        const b = branches.find((branch) => branch.id === branchId)
                        if (!b) return 'Selecione a filial'
                        return (
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{b.name} ({b.city})</span>
                          </span>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{b.name} ({b.city})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Produtor */}
              <div className="space-y-1.5">
                <Label htmlFor="producer" className="text-xs font-semibold">
                  Produtor Rural / Cliente:
                </Label>
                <Select
                  value={producerId}
                  onValueChange={(val) => {
                    setProducerId(val || '')
                    setPropertyId('')
                  }}
                >
                  <SelectTrigger id="producer" className="w-full text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Selecione o produtor rural">
                      {(() => {
                        const p = producers.find((prod) => prod.id === producerId)
                        if (!p) return 'Selecione o produtor rural'
                        return (
                          <span className="flex items-center gap-1.5 truncate">
                            <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{p.name} ({p.document})</span>
                          </span>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {producers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{p.name} ({p.document})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Propriedade */}
              <div className="space-y-1.5">
                <Label htmlFor="property" className="text-xs font-semibold">
                  Propriedade Rural (Opcional):
                </Label>
                <Select
                  value={propertyId || 'NENHUMA'}
                  onValueChange={(val) => setPropertyId(val === 'NENHUMA' || !val ? '' : val)}
                >
                  <SelectTrigger id="property" className="w-full text-xs font-medium bg-white border-slate-200">
                    <SelectValue placeholder="Nenhuma propriedade vinculada">
                      {(() => {
                        if (!propertyId || propertyId === 'NENHUMA') return 'Nenhuma propriedade vinculada'
                        const prop = availableProperties.find((pr) => pr.id === propertyId)
                        if (!prop) return 'Nenhuma propriedade vinculada'
                        return (
                          <span className="flex items-center gap-1.5 truncate">
                            <Sprout className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{prop.name}</span>
                          </span>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUMA">Nenhuma propriedade vinculada</SelectItem>
                    {availableProperties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        <span className="flex items-center gap-2">
                          <Sprout className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{prop.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ano Safra com Máscara */}
              <div className="space-y-1.5">
                <Label htmlFor="cropYear" className="text-xs font-semibold">
                  Ano Safra:
                </Label>
                <Input
                  id="cropYear"
                  value={cropYear}
                  onChange={(e) => setCropYear(maskCropYear(e.target.value))}
                  placeholder="2025/2026"
                  maxLength={9}
                  className="text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card: Discriminação do Serviço e Valores */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Discriminação do Serviço & Categoria
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Categoria */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold">
                  Plano de Contas (Receita):
                </Label>
                <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')}>
                  <SelectTrigger id="category" className="w-full text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Selecione o plano de contas" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        [{c.code}] {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Número Documento */}
              <div className="space-y-1.5">
                <Label htmlFor="docNum" className="text-xs font-semibold">
                  Nº Documento / Contrato (Deixe em branco para auto):
                </Label>
                <Input
                  id="docNum"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="FAT-2026-0001"
                  className="text-xs font-mono"
                />
              </div>

              {/* Subtipo de Serviço */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="serviceSubtype" className="text-xs font-semibold">
                  Descrição Específica do Serviço Prestado:
                </Label>
                <Input
                  id="serviceSubtype"
                  value={serviceSubtype}
                  onChange={(e) => setServiceSubtype(e.target.value)}
                  placeholder="Ex: Elaboração de CAR e Memorial Descritivo de Reserva Legal"
                  className="text-xs font-semibold"
                />
              </div>

              {/* Valores */}
              <div className="space-y-1.5">
                <Label htmlFor="gross" className="text-xs font-semibold">
                  Valor Bruto do Contrato (R$):
                </Label>
                <Input
                  id="gross"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(parseFloat(e.target.value) || 0)}
                  className="text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discount" className="text-xs font-semibold">
                  Desconto Comercial Concedido (R$):
                </Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="text-xs font-semibold text-rose-700"
                />
              </div>
            </div>
          </div>

          {/* Card: Condição de Pagamento e Parcelas */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Condição de Pagamento & Grade de Vencimentos
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="numInstallments" className="text-xs font-semibold">
                  Número de Parcelas:
                </Label>
                <Select
                  value={String(numInstallments)}
                  onValueChange={(val) => setNumInstallments(parseInt(val || '1', 10))}
                >
                  <SelectTrigger id="numInstallments" className="w-full text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Número de Parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x (À Vista)</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="firstDueDate" className="text-xs font-semibold">
                  Vencimento da 1ª Parcela:
                </Label>
                <DatePicker
                  value={firstDueDate}
                  onChange={(val) => setFirstDueDate(val || '')}
                  placeholder="DD/MM/AAAA"
                  className="text-xs h-9"
                  showPresets={false}
                />
              </div>
            </div>

            {/* Prévia da Grade */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500">
                Projeção da Grade de Títulos a Gerar:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {installmentsGrid.map((inst) => (
                  <div
                    key={inst.installmentNumber}
                    className="rounded border border-slate-200 bg-white p-2 text-[11px]"
                  >
                    <div className="font-bold text-slate-700">
                      Parcela {inst.installmentNumber}/{inst.totalInstallments}
                    </div>
                    <div className="text-emerald-700 font-extrabold">
                      {formatCurrency(inst.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Venc.: {new Date(inst.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 3: Parceiro & Resumo */}
        <div className="space-y-6">
          {/* Card: Parceiro Originador */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. Parceiro Indicador (Opcional)
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="partner" className="text-xs font-semibold">
                  Prospectador / Corretor:
                </Label>
                <Select
                  value={partnerId || 'NENHUM'}
                  onValueChange={(val) => setPartnerId(val === 'NENHUM' || !val ? '' : val)}
                >
                  <SelectTrigger id="partner" className="w-full text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Nenhum parceiro (Venda Direta)">
                      {(() => {
                        if (!partnerId || partnerId === 'NENHUM') return 'Nenhum parceiro (Venda Direta)'
                        const p = partners.find((part) => part.id === partnerId)
                        if (!p) return 'Nenhum parceiro (Venda Direta)'
                        return (
                          <span className="flex items-center gap-1.5 truncate">
                            <Users2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </span>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUM">Nenhum parceiro (Venda Direta)</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <Users2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                          <span>{p.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {partnerCommissionPreview && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1 text-xs">
                  <div className="font-bold text-amber-900">
                    Trava de Comissão Prevista:
                  </div>
                  <div className="text-slate-700">
                    Percentual: <strong>{partnerCommissionPreview.rate}%</strong>
                  </div>
                  <div className="text-slate-700">
                    Valor Provisionado:{' '}
                    <strong className="text-amber-900">
                      {formatCurrency(partnerCommissionPreview.commissionAmount)}
                    </strong>
                  </div>
                  <p className="text-[10px] text-amber-800 pt-1">
                    * Ficará com status <strong>BLOQUEADO</strong> até a baixa declaratória das
                    parcelas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Resumo Final & Submit */}
          <div className="rounded-xl border border-emerald-900/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-white shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Resumo do Faturamento
            </h3>

            <div className="space-y-2 text-xs border-b border-slate-800 pb-4">
              <div className="flex justify-between text-slate-300">
                <span>Valor Bruto:</span>
                <span>{formatCurrency(grossAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-400 font-medium">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-1">
                <span>Valor Líquido:</span>
                <span className="text-emerald-400">{formatCurrency(netAmount)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Condição: {numInstallments}x no boleto / recibo</div>
              <div>Origem: Pacote Avulso Direto</div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || netAmount <= 0}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5"
              >
                {isSubmitting ? 'Gerando Títulos...' : 'Confirmar & Gerar Títulos'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
