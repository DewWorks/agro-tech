'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'

interface ProducerLegalDataStepProps {
  formData: any
  handleChange: (field: string, value: string) => void
}

export function ProducerLegalDataStep({
  formData,
  handleChange,
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
            <Label>Profissão</Label>
            <Input 
              value={formData.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
              placeholder="Ex: Produtor(a) Rural"
            />
          </div>
          <div className="space-y-2">
            <Label>Registro Geral (RG)</Label>
            <Input 
              value={formData.rg}
              onChange={(e) => handleChange('rg', e.target.value)}
              placeholder="Ex: 0000000"
            />
          </div>
          <div className="space-y-2">
            <Label>Órgão Emissor do RG</Label>
            <Input 
              value={formData.rgIssuer}
              onChange={(e) => handleChange('rgIssuer', e.target.value)}
              placeholder="Ex: SSP/TO"
            />
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
