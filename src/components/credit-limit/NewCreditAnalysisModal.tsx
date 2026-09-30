'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Landmark, ArrowRight, Loader2 } from 'lucide-react'
import { getPropertiesForCreditLimitSelect } from '@/actions/credit-limit'
import { toast } from 'sonner'

interface NewCreditAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProperty?: (propertyId: string) => void
}

export function NewCreditAnalysisModal({
  isOpen,
  onClose,
  onSelectProperty,
}: NewCreditAnalysisModalProps) {
  const router = useRouter()
  const [properties, setProperties] = useState<
    Array<{
      id: string
      name: string
      propertyName: string | null
      city: string | null
      state: string | null
      totalArea: number
      producerName: string
      producerId: string
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      getPropertiesForCreditLimitSelect()
        .then((props) => {
          setProperties(props)
          if (props.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(props[0].id)
          }
        })
        .catch((err) => {
          console.error(err)
          toast.error('Erro ao listar propriedades cadastradas.')
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (!selectedPropertyId) {
      toast.error('Selecione uma propriedade para simular o limite de crédito.')
      return
    }

    if (onSelectProperty) {
      onSelectProperty(selectedPropertyId)
      onClose()
    } else {
      router.push(`/admin/credit-limit?propertyId=${selectedPropertyId}&tab=simulator`)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#1B4D3E] dark:text-emerald-400">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <DialogTitle className="text-base font-bold">
              Novo Levantamento de Limite de Crédito
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Selecione uma propriedade rural da carteira cadastrada para iniciar o cálculo de lastro patrimonial, fluxo de caixa e enquadramento MCR.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Carregando carteira de propriedades...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              Nenhuma propriedade cadastrada na filial. Cadastre um imóvel no CRM antes de simular o limite de crédito.
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Propriedade Rural & Produtor
              </Label>
              <Select
                value={selectedPropertyId}
                onValueChange={(val) => {
                  if (val) setSelectedPropertyId(val)
                }}
              >
                <SelectTrigger className="text-xs h-10 bg-slate-50 dark:bg-slate-800/60">
                  <SelectValue placeholder="Selecione o imóvel..." />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.producerName} • {p.city || 'Sem cidade'}/{p.state || 'UF'} •{' '}
                          {p.totalArea.toFixed(1)} ha
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPropertyId || loading}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold gap-1.5"
          >
            <span>Iniciar Simulação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
