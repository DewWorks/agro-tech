'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'
import ProducerDocumentsSection from '../../ged/ProducerDocumentsSection'

interface ProducerQualificationStepProps {
  initialData?: any
  formData: any
  handleChange: (field: string, value: string) => void
}

export function ProducerQualificationStep({
  initialData,
  formData,
  handleChange,
}: ProducerQualificationStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
        <div className="space-y-2">
          <Label>Nº DAP / CAF (Opcional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Necessário para enquadramento no PRONAF e taxas subsidiadas.
          </p>
          <Input 
            value={formData.dapCafNumber}
            onChange={(e) => handleChange('dapCafNumber', e.target.value)}
            placeholder="Código DAP ou CAF"
          />
        </div>
      </div>
      {initialData?.id ? (
        <div className="col-span-1 md:col-span-2">
          <ProducerDocumentsSection
            producerId={initialData.id}
            branchId={formData.branchId}
          />
        </div>
      ) : (
        <div className="col-span-1 md:col-span-2 p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
          <FileText className="h-8 w-8 mb-2 opacity-50" />
          <p className="font-medium">Gestão Eletrônica de Documentos</p>
          <p className="text-xs text-center mt-1 max-w-md">
            Salve o produtor primeiro para habilitar o upload de documentos (RG, CNH, Certidões) para a nuvem.
          </p>
        </div>
      )}
    </div>
  )
}
