'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProducerSpouseStepProps {
  formData: any
  handleChange: (field: string, value: string) => void
  errors: Record<string, string>
}

export function ProducerSpouseStep({
  formData,
  handleChange,
  errors,
}: ProducerSpouseStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-1 md:col-span-2 p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
        <strong className="block mb-1">Atenção: Exigência de Outorga Uxória</strong>
        Como o estado civil é Casado ou União Estável, os dados do cônjuge e o regime de casamento são cruciais para a emissão de garantias (Hipoteca/Alienação).
      </div>

      <div className="space-y-2 col-span-1 md:col-span-2">
        <Label>Regime de Casamento *</Label>
        <Select 
          value={formData.marriageRegime} 
          onValueChange={(val) => handleChange('marriageRegime', val)}
        >
          <SelectTrigger className={`w-full ${errors.marriageRegime ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Selecione o regime">
              {{
                COMUNHAO_PARCIAL: 'Comunhão Parcial de Bens',
                COMUNHAO_UNIVERSAL: 'Comunhão Universal de Bens',
                SEPARACAO_TOTAL: 'Separação Total (Convencional)',
                SEPARACAO_OBRIGATORIA: 'Separação Obrigatória (Legal)',
                PARTICIPACAO_FINAL: 'Participação Final nos Aquestos',
              }[formData.marriageRegime as string] || formData.marriageRegime}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COMUNHAO_PARCIAL">Comunhão Parcial de Bens</SelectItem>
            <SelectItem value="COMUNHAO_UNIVERSAL">Comunhão Universal de Bens</SelectItem>
            <SelectItem value="SEPARACAO_TOTAL">Separação Total (Convencional)</SelectItem>
            <SelectItem value="SEPARACAO_OBRIGATORIA">Separação Obrigatória (Legal)</SelectItem>
            <SelectItem value="PARTICIPACAO_FINAL">Participação Final nos Aquestos</SelectItem>
          </SelectContent>
        </Select>
        {errors.marriageRegime && <p className="text-xs text-red-500 font-medium">{errors.marriageRegime}</p>}
      </div>

      <div className="space-y-2 col-span-1 md:col-span-2">
        <Label>Nome do Cônjuge *</Label>
        <Input 
          value={formData.spouseName}
          onChange={(e) => handleChange('spouseName', e.target.value)}
          placeholder="Nome completo do cônjuge"
          className={errors.spouseName ? 'border-red-500' : ''}
        />
        {errors.spouseName && <p className="text-xs text-red-500 font-medium">{errors.spouseName}</p>}
      </div>

      <div className="space-y-2">
        <Label>CPF do Cônjuge</Label>
        <Input 
          value={formData.spouseCpf}
          onChange={(e) => handleChange('spouseCpf', e.target.value)}
          placeholder="000.000.000-00"
          className={errors.spouseCpf ? 'border-red-500' : ''}
          maxLength={14}
        />
        {errors.spouseCpf && <p className="text-xs text-red-500 font-medium">{errors.spouseCpf}</p>}
      </div>
    </div>
  )
}
