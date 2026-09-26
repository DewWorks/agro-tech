'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'
import ProducerDocumentsSection from '../../ged/ProducerDocumentsSection'
import { maskBankAgency, maskBankAccount } from '@/lib/utils/masks'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CREDIT_BANKS } from '@/lib/validations/reference-data'
import { Building2, Wallet } from 'lucide-react'

interface ProducerQualificationStepProps {
  initialData?: any
  formData: any
  handleChange: (field: string, value: string) => void
  errors?: Record<string, string>
}

export function ProducerQualificationStep({
  initialData,
  formData,
  handleChange,
  errors = {},
}: ProducerQualificationStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enquadramento e Porte */}
      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
        <h3 className="text-base font-semibold text-[#1B4D3E] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          Enquadramento e Porte do Produtor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Porte do Produtor (Classificação BACEN)</Label>
            <Select
              value={formData.producerSize || 'MEDIO'}
              onValueChange={(val) => handleChange('producerSize', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o porte">
                  {{
                    MINI: 'Mini Produtor (PRONAF)',
                    PEQUENO: 'Pequeno Produtor Rural',
                    MEDIO: 'Médio Produtor (PRONAMP)',
                    GRANDE: 'Grande Produtor Rural',
                  }[formData.producerSize as string] || formData.producerSize}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MINI">Mini Produtor (PRONAF)</SelectItem>
                <SelectItem value="PEQUENO">Pequeno Produtor Rural</SelectItem>
                <SelectItem value="MEDIO">Médio Produtor (PRONAMP)</SelectItem>
                <SelectItem value="GRANDE">Grande Produtor Rural</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nº DAP / CAF (Opcional)</Label>
            <Input 
              value={formData.dapCafNumber}
              onChange={(e) => handleChange('dapCafNumber', e.target.value)}
              placeholder="Código DAP ou CAF"
            />
            <p className="text-[11px] text-muted-foreground">
              Necessário para enquadramento no PRONAF e taxas subsidiadas.
            </p>
          </div>
        </div>
      </div>

      {/* Domicílio Bancário para Operações de Crédito */}
      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
        <h3 className="text-base font-semibold text-[#1B4D3E] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          Dados Bancários para Crédito Rural e Liberações
        </h3>
        <p className="text-xs text-muted-foreground mt-0">
          Conta bancária titular do proponente para crédito das parcelas de financiamento ou custeio.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Instituição Financeira / Banco</Label>
            <Select
              value={formData.bankName}
              onValueChange={(val) => handleChange('bankName', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o banco">
                  {CREDIT_BANKS.find((b) => b.value === formData.bankName || b.label === formData.bankName)?.label || formData.bankName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CREDIT_BANKS.map((b) => (
                  <SelectItem key={b.value} value={b.label}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agência (com dígito)</Label>
            <Input 
              value={formData.bankAgency}
              onChange={(e) => handleChange('bankAgency', maskBankAgency(e.target.value))}
              placeholder="Ex: 1234-5"
              maxLength={7}
              className={errors.bankAgency ? 'border-red-500' : ''}
            />
            {errors.bankAgency && <p className="text-xs text-red-500 font-medium">{errors.bankAgency}</p>}
          </div>

          <div className="space-y-2">
            <Label>Conta e Dígito</Label>
            <Input 
              value={formData.bankAccount}
              onChange={(e) => handleChange('bankAccount', maskBankAccount(e.target.value))}
              placeholder="Ex: 98765-4"
              maxLength={14}
              className={errors.bankAccount ? 'border-red-500' : ''}
            />
            {errors.bankAccount && <p className="text-xs text-red-500 font-medium">{errors.bankAccount}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Tipo de Conta</Label>
            <Select
              value={formData.bankAccountType || 'CORRENTE'}
              onValueChange={(val) => handleChange('bankAccountType', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo de conta">
                  {formData.bankAccountType === 'POUPANCA' ? 'Conta Poupança' : 'Conta Corrente'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORRENTE">Conta Corrente</SelectItem>
                <SelectItem value="POUPANCA">Conta Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
