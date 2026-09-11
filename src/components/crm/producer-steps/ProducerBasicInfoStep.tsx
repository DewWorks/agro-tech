'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin, Plus, Pencil } from 'lucide-react'
import { formatCNPJ } from '@/lib/utils/masks'

interface ProducerBasicInfoStepProps {
  branches: any[]
  initialData?: any
  formData: any
  handleChange: (field: string, value: string) => void
  setFormData: React.Dispatch<React.SetStateAction<any>>
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setActiveTab: (tab: string) => void
}

export function ProducerBasicInfoStep({
  branches,
  initialData,
  formData,
  handleChange,
  setFormData,
  errors,
  setErrors,
  setActiveTab,
}: ProducerBasicInfoStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {initialData?.properties && initialData.properties.length > 0 && (
        <div className="col-span-1 md:col-span-2 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-[#1B4D3E] flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                {initialData.properties.length} Propriedade(s) Rural(is) Vinculada(s)
              </span>
              <span className="text-[11px] text-emerald-700">
                {initialData.properties.map((p: any) => p.property?.name).filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('PROPRIEDADE')}
              className="text-xs text-[#1B4D3E] border-emerald-300 hover:bg-emerald-100 font-semibold h-8 cursor-pointer"
            >
              Ver Propriedades →
            </Button>
            {initialData.properties[0]?.property?.id && (
              <Link href={`/admin/crm/properties/${initialData.properties[0].property.id}/edit`}>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-8 gap-1 shadow-2xs cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  Acessar Fazenda
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2 col-span-1 md:col-span-2">
        <Label>Filial de Vínculo *</Label>
        <div className="flex gap-2">
          <Select 
            value={formData.branchId} 
            onValueChange={(val) => handleChange('branchId', val)}
            disabled={branches.length === 0}
          >
            <SelectTrigger className={`w-full flex-1 ${errors.branchId ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={branches.length === 0 ? "Nenhuma filial disponível" : "Selecione a filial"}>
                {formData.branchId && branches.find(b => b.id === formData.branchId) 
                  ? `${branches.find(b => b.id === formData.branchId)?.name} - CNPJ: ${formatCNPJ(branches.find(b => b.id === formData.branchId)?.cnpj || '')}`
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => {
                if (!branch.isActive) return null

                return (
                  <SelectItem 
                    key={branch.id} 
                    value={branch.id}
                  >
                    <div className="flex items-center gap-3">
                      <span>{branch.name}</span>
                      {branch.isActive ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 pointer-events-none">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 pointer-events-none">
                          Inativa
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {branches.length > 0 && (
            <Link href="/admin/branches/new">
              <Button type="button" variant="outline" title="Criar Nova Filial">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        {errors.branchId && <p className="text-xs text-red-500 font-medium">{errors.branchId}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Produtor</Label>
        <Select 
          value={formData.type} 
          onValueChange={(val) => {
            setFormData({ ...formData, type: val, document: '' })
            setErrors({ ...errors, document: '' })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo">
              {formData.type === 'PJ' ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PF">Pessoa Física (CPF)</SelectItem>
            <SelectItem value="PJ">Pessoa Jurídica (CNPJ)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{formData.type === 'PF' ? 'CPF' : 'CNPJ'} *</Label>
        <Input 
          value={formData.document}
          onChange={(e) => handleChange('document', e.target.value)}
          placeholder={formData.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
          className={errors.document ? 'border-red-500 focus-visible:ring-red-500' : ''}
          maxLength={formData.type === 'PF' ? 14 : 18}
        />
        {errors.document && <p className="text-xs text-red-500 font-medium">{errors.document}</p>}
      </div>

      <div className="space-y-2 col-span-1 md:col-span-2">
        <Label>Nome Completo / Razão Social *</Label>
        <Input 
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ex: João da Silva / AgroTech LTDA"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input 
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="email@exemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Telemóvel / Telefone</Label>
        <Input 
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(00) 00000-0000"
          maxLength={15}
        />
      </div>

      {formData.type === 'PJ' && (
        <div className="space-y-2 col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-lg border">
          <Label className="text-[#1B4D3E]">CPF do Representante Legal *</Label>
          <Input 
            value={formData.representativeCpf}
            onChange={(e) => handleChange('representativeCpf', e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className={errors.representativeCpf ? 'border-red-500' : ''}
          />
          <p className="text-xs text-slate-500">
            Necessário para assinatura de documentos, procurações e declarações onde a Pessoa Jurídica é representada.
          </p>
          {errors.representativeCpf && <p className="text-xs text-red-500 font-medium">{errors.representativeCpf}</p>}
        </div>
      )}

      {formData.type === 'PF' && (
        <div className="space-y-2 col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-lg border">
          <Label className="text-[#1B4D3E]">Estado Civil</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Importante: O estado civil dita a exigência de Outorga Uxória para garantias.
          </p>
          <Select 
            value={formData.civilStatus} 
            onValueChange={(val) => {
              setFormData({ ...formData, civilStatus: val, marriageRegime: '' })
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Selecione o estado civil">
                {{
                  SOLTEIRO: 'Solteiro(a)',
                  CASADO: 'Casado(a)',
                  UNIAO_ESTAVEL: 'União Estável',
                  DIVORCIADO: 'Divorciado(a)',
                  VIUVO: 'Viúvo(a)',
                }[formData.civilStatus as string] || formData.civilStatus}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
              <SelectItem value="CASADO">Casado(a)</SelectItem>
              <SelectItem value="UNIAO_ESTAVEL">União Estável</SelectItem>
              <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
              <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
