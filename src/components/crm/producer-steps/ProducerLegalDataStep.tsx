'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { maskRG, maskIssuerUF } from '@/lib/utils/masks'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EDUCATION_LEVEL_OPTIONS } from '@/lib/validations/reference-data'

interface ProducerLegalDataStepProps {
  formData: any
  handleChange: (field: string, value: string) => void
  errors?: Record<string, string>
}

export function ProducerLegalDataStep({
  formData,
  handleChange,
  errors = {},
}: ProducerLegalDataStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-1 md:col-span-2 space-y-4 p-5 border rounded-xl bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B4D3E]">Documentação e Informações Legais</h3>
        <p className="text-sm text-muted-foreground mt-0">Essas informações costumam ser preenchidas automaticamente pela emissão de documentos, mas você pode editar aqui.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Nacionalidade</Label>
            <Input 
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              placeholder="Ex: Brasileiro(a)"
            />
          </div>
          <div className="space-y-2">
            <Label>Naturalidade (Cidade/UF)</Label>
            <Input 
              value={formData.naturalness}
              onChange={(e) => handleChange('naturalness', e.target.value)}
              placeholder="Ex: Porto Nacional / TO"
            />
          </div>
          <div className="space-y-2">
            <Label>Profissão</Label>
            <Input 
              value={formData.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
              placeholder="Ex: Produtor(a) Rural"
            />
          </div>
          <div className="space-y-2">
            <Label>Escolaridade / Grau de Instrução</Label>
            <Select
              value={formData.educationLevel}
              onValueChange={(val) => handleChange('educationLevel', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a escolaridade">
                  {EDUCATION_LEVEL_OPTIONS.find((opt) => opt.value === formData.educationLevel)?.label || formData.educationLevel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Registro Geral (RG)</Label>
            <Input 
              value={formData.rg}
              onChange={(e) => handleChange('rg', maskRG(e.target.value))}
              placeholder="Ex: 0000000"
              maxLength={14}
              className={errors.rg ? 'border-red-500' : ''}
            />
            {errors.rg && <p className="text-xs text-red-500 font-medium">{errors.rg}</p>}
          </div>
          <div className="space-y-2">
            <Label>Órgão Emissor do RG</Label>
            <Input 
              value={formData.rgIssuer}
              onChange={(e) => handleChange('rgIssuer', maskIssuerUF(e.target.value))}
              placeholder="Ex: SSP/TO"
              maxLength={8}
              className={errors.rgIssuer ? 'border-red-500' : ''}
            />
            {errors.rgIssuer && <p className="text-xs text-red-500 font-medium">{errors.rgIssuer}</p>}
          </div>
          {formData.type === 'PF' && (
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <DatePicker
                value={formData.birthDate}
                onChange={(val) => handleChange('birthDate', val)}
                placeholder="DD/MM/AAAA"
                showPresets={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
