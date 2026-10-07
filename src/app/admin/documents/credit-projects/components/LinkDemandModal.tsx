'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Link2,
  Calendar,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ClipboardList,
} from 'lucide-react'
import {
  CreditProjectHistoryItem,
  getActiveDemandsForProducer,
  linkProjectToExistingDemand,
} from '@/actions/credit-projects'
import { DEMAND_STATUS_METAS, DemandStatusCode, RURAL_SERVICES_CATALOG, RuralServiceTypeCode } from '@/lib/validations/demands'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LinkDemandModalProps {
  isOpen: boolean
  onClose: () => void
  project: CreditProjectHistoryItem | null
  onSuccess: () => void
  onCreateNewDemand?: (project: CreditProjectHistoryItem) => void
}

interface ActiveDemandItem {
  id: string
  serviceType: string
  customServiceType: string | null
  status: string
  notes: string | null
  proposalId: string | null
  createdAt: Date | string
  property: {
    id: string
    name: string
    propertyName: string
  } | null
}

export function LinkDemandModal({
  isOpen,
  onClose,
  project,
  onSuccess,
  onCreateNewDemand,
}: LinkDemandModalProps) {
  const [demands, setDemands] = useState<ActiveDemandItem[]>([])
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && project?.producerId) {
      setIsLoading(true)
      setSelectedDemandId(null)
      setError(null)
      setSuccess(false)

      getActiveDemandsForProducer(project.producerId)
        .then((res) => {
          if (res.success && res.demands) {
            setDemands(res.demands as any)
          } else {
            setError(res.error || 'Não foi possível carregar as demandas do produtor.')
          }
        })
        .catch((err) => {
          setError(err?.message || 'Falha ao buscar demandas ativas.')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, project])

  if (!project) return null

  const handleLink = async () => {
    if (!selectedDemandId || !project) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await linkProjectToExistingDemand({
        formId: project.id,
        demandId: selectedDemandId,
        documentId: project.documentId || undefined,
        templateCode: project.templateCode,
        financedAmount: project.financedAmount || 0,
        fileName: project.fileName || undefined,
      })

      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1200)
      } else {
        setError(res.error || 'Erro ao vincular projeto à demanda.')
      }
    } catch (err: any) {
      setError(err?.message || 'Falha de comunicação com o servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-[#1B4D3E] flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Vincular a uma Demanda Aberta
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecione uma ordem de serviço em andamento de{' '}
                <strong className="text-gray-900">{project.producerName}</strong> para associar este projeto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Projeto Vinculado com Sucesso!</h4>
            <p className="text-xs text-muted-foreground">
              O documento oficial e o checklist da demanda foram atualizados no sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mx-auto" />
                <p className="text-xs text-muted-foreground">Buscando demandas abertas do produtor...</p>
              </div>
            ) : demands.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                <ClipboardList className="h-9 w-9 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Nenhuma Demanda Ativa Encontrada</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Este proponente não possui ordens de serviço em andamento no momento.
                  </p>
                </div>
                {onCreateNewDemand && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onClose()
                      onCreateNewDemand(project)
                    }}
                    className="h-8 text-xs font-bold text-[#1B4D3E] border-[#1B4D3E]/30 hover:bg-emerald-50 gap-1.5"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Criar Nova Demanda Técnica Agora
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {demands.map((demand) => {
                  const isSelected = selectedDemandId === demand.id
                  const statusMeta = (DEMAND_STATUS_METAS as any)[demand.status] || {
                    label: demand.status,
                    color: 'slate',
                  }
                  const serviceMeta = (RURAL_SERVICES_CATALOG as any)[demand.serviceType]
                  const serviceTitle = serviceMeta?.label || demand.customServiceType || demand.serviceType

                  const formattedDate = demand.createdAt
                    ? format(new Date(demand.createdAt), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'

                  return (
                    <div
                      key={demand.id}
                      onClick={() => setSelectedDemandId(demand.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            #{demand.id.slice(-6).toUpperCase()}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold bg-white text-slate-700 border-slate-200"
                          >
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{serviceTitle}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {demand.property && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {demand.property.propertyName || demand.property.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleLink}
                disabled={!selectedDemandId || isSubmitting}
                className="text-xs h-9 bg-[#1B4D3E] hover:bg-[#113025] text-white font-bold gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Vinculando...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Confirmar Vínculo</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
