'use client'

import { useState } from 'react'
import { CreditCard, Check, Sparkles, Building2, Calendar, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  activateOrganizationSubscription,
  updateOrganizationPlan,
} from '@/actions/billing'

interface PlanOption {
  code: string
  name: string
  price: number
  description: string | null
  maxBranches: number
  maxUsers: number
}

interface SubscriptionManagementModalProps {
  organizationId: string
  organizationName: string
  organizationCnpj: string
  ownerEmail?: string
  currentPlanCode?: string
  currentCustomPrice?: number | null
  currentDueDay?: number
  plans: PlanOption[]
  isUpdateMode?: boolean
}

export function SubscriptionManagementModal({
  organizationId,
  organizationName,
  organizationCnpj,
  ownerEmail = '',
  currentPlanCode = 'FOUNDER_300',
  currentCustomPrice = null,
  currentDueDay = 10,
  plans,
  isUpdateMode = false,
}: SubscriptionManagementModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlanCode)
  const [customPrice, setCustomPrice] = useState<string>(
    currentCustomPrice ? String(currentCustomPrice) : '',
  )
  const [dueDay, setDueDay] = useState<number>(currentDueDay)
  const [billingName, setBillingName] = useState<string>(organizationName)
  const [billingCpfCnpj, setBillingCpfCnpj] = useState<string>(organizationCnpj)
  const [billingEmail, setBillingEmail] = useState<string>(ownerEmail)
  const [billingPhone, setBillingPhone] = useState<string>('')

  const activePlanData = plans.find((p) => p.code === selectedPlan)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const parsedCustomPrice = customPrice.trim() !== '' ? Number(customPrice.replace(',', '.')) : undefined

      if (isUpdateMode) {
        const res = await updateOrganizationPlan({
          organizationId,
          newPlanCode: selectedPlan,
          customPrice: parsedCustomPrice,
          updatePendingPayments: true,
        })

        if (!res.success) {
          throw new Error(res.error)
        }
        toast.success('Plano da organização atualizado com sucesso no Asaas!')
      } else {
        const res = await activateOrganizationSubscription({
          organizationId,
          planCode: selectedPlan,
          billingDueDay: Number(dueDay),
          customPrice: parsedCustomPrice,
          billingName,
          billingCpfCnpj,
          billingEmail,
          billingPhone: billingPhone.trim() !== '' ? billingPhone : undefined,
        })

        if (!res.success) {
          throw new Error(res.error)
        }
        toast.success('Assinatura Asaas ativada com sucesso!')
      }

      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar assinatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        {...({ nativeButton: false } as any)}
        render={
          <Button variant={isUpdateMode ? 'outline' : 'default'} size="sm" className="gap-2" />
        }
      >
        <CreditCard className="w-4 h-4" />
        <span>{isUpdateMode ? 'Gerenciar Assinatura' : 'Ativar Assinatura Asaas'}</span>
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#1B4D3E]">
            <Building2 className="w-5 h-5 text-[#1B4D3E]" />
            <span>{isUpdateMode ? 'Alterar Plano / Preço' : 'Ativar Cobrança Recorrente Asaas'}</span>
          </DialogTitle>
          <DialogDescription>
            Configuração do faturamento SaaS da organização <strong>{organizationName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Seletor de Planos */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Selecione o Plano Base</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.code
                const isFounder = p.code === 'FOUNDER_300'
                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code)}
                    className={`cursor-pointer rounded-xl p-3.5 border text-left transition-all relative ${
                      isSelected
                        ? 'border-[#1B4D3E] bg-emerald-50/50 ring-2 ring-[#1B4D3E]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {isFounder && (
                      <span className="absolute -top-2 right-2 bg-[#1B4D3E] text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Pioneiro
                      </span>
                    )}
                    <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                    <div className="text-lg font-bold text-[#1B4D3E] mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        p.price,
                      )}
                      <span className="text-xs font-normal text-slate-500">/mês</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {p.description}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sobrescrita de Preço (Negociação Especial) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="customPrice" className="text-sm font-semibold text-slate-900">
                  Preço Customizado / Negociado (Opcional)
                </Label>
                <p className="text-xs text-slate-500">
                  Se preenchido, este valor substituirá o preço de tabela do plano para esta organização.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">R$</span>
              <Input
                id="customPrice"
                type="number"
                step="0.01"
                placeholder={activePlanData ? String(activePlanData.price) : '300.00'}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="max-w-[180px] bg-white font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Dados Fiscais e Dia de Vencimento */}
          {!isUpdateMode && (
            <div className="space-y-4 pt-1 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Parâmetros e Dados do Sacado no Asaas
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dueDay" className="text-xs font-medium">
                    Dia de Vencimento Mensal
                  </Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min={1}
                    max={28}
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    required
                  />
                  <span className="text-[10px] text-slate-400">Dias entre 1 e 28 do mês</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="billingName" className="text-xs font-medium">
                    Razão Social / Nome Sacado
                  </Label>
                  <Input
                    id="billingName"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="billingCpfCnpj" className="text-xs font-medium">
                    CNPJ do Sacado
                  </Label>
                  <Input
                    id="billingCpfCnpj"
                    value={billingCpfCnpj}
                    onChange={(e) => setBillingCpfCnpj(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="billingEmail" className="text-xs font-medium">
                    E-mail para Recebimento de Cobranças
                  </Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="billingPhone" className="text-xs font-medium">
                    Telefone / Celular (Opcional para alertas Asaas)
                  </Label>
                  <Input
                    id="billingPhone"
                    placeholder="(63) 99999-9999"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#1B4D3E] hover:bg-[#153e32] text-white font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isUpdateMode ? 'Salvar Alterações' : 'Confirmar e Ativar no Asaas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
