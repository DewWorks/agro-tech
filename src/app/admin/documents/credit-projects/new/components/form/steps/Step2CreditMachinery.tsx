import React from 'react'
import { Tractor, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MACHINERY_CATEGORIES } from '@/lib/validations/reference-data'
import { CustomOptions } from '../../../types/wizard-types'

interface Step2CreditMachineryProps {
  customOptions: CustomOptions
  setCustomOptions: React.Dispatch<React.SetStateAction<CustomOptions>>
  onBack: () => void
  onAdvance: () => void
}

export function Step2CreditMachinery({
  customOptions,
  setCustomOptions,
  onBack,
  onAdvance
}: Step2CreditMachineryProps) {
  const machineryItems = customOptions.machineryItems || []

  const updateMachinery = (items: typeof machineryItems) => {
    const totalVal = items.reduce((acc, m) => acc + (Number(m.value) || 0), 0)
    setCustomOptions(prev => ({
      ...prev,
      machineryItems: items,
      machineryValue: totalVal
    }))
  }

  const addMachine = () => {
    const newItems = [
      ...machineryItems,
      {
        id: Math.random().toString(),
        type: 'Trator de Pneus',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        chassi: '',
        value: 0
      }
    ]
    updateMachinery(newItems)
  }

  const removeMachine = (idx: number) => {
    const newItems = machineryItems.filter((_, i) => i !== idx)
    updateMachinery(newItems)
  }

  const updateMachineField = (idx: number, field: string, value: any) => {
    const newItems = [...machineryItems]
    newItems[idx] = { ...newItems[idx], [field]: value }
    updateMachinery(newItems)
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Tractor className="h-5 w-5 text-[#1B4D3E]" />
            Passo 2: Parque de Máquinas, Equipamentos & Veículos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastre os tratores, colheitadeiras e implementos agrícolas que compõem o patrimônio do proponente.
          </p>
        </div>
        <Button
          type="button"
          onClick={addMachine}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-xs self-start"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar Máquina
        </Button>
      </div>

      {/* Total Manual / Resumo */}
      <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <Label className="text-xs font-semibold text-gray-800">Valor Total Avaliado da Frota (R$)</Label>
          <p className="text-[11px] text-muted-foreground">
            Você pode preencher o valor total diretamente ou detalhar item a item abaixo.
          </p>
        </div>
        <Input
          type="number"
          value={customOptions.machineryValue || ''}
          onChange={(e) => setCustomOptions(prev => ({ ...prev, machineryValue: Number(e.target.value) }))}
          className="h-10 text-xs font-bold bg-white"
          placeholder="0,00"
        />
      </div>

      {/* DataGrid de Máquinas */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-800 block">
          Frota e Implementos Cadastrados ({machineryItems.length})
        </span>

        {machineryItems.length === 0 ? (
          <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center space-y-2">
            <Tractor className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-medium">
              Nenhum maquinário cadastrado individualmente.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMachine}
              className="text-xs text-[#1B4D3E] border-emerald-300"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Primeiro Maquinário
            </Button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="p-3">Categoria / Tipo</th>
                  <th className="p-3">Marca</th>
                  <th className="p-3">Modelo</th>
                  <th className="p-3 w-20 text-center">Ano</th>
                  <th className="p-3">Chassi / Nº Série</th>
                  <th className="p-3 text-right">Valor Estimado (R$)</th>
                  <th className="p-3 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {machineryItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-2">
                      <Select
                        value={item.type}
                        onValueChange={(val) => updateMachineField(idx, 'type', val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full min-w-[170px]">
                          <SelectValue placeholder="Categoria">{item.type}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MACHINERY_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat} className="text-xs">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="Ex: John Deere"
                        value={item.brand}
                        onChange={(e) => updateMachineField(idx, 'brand', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="Ex: 7215J"
                        value={item.model}
                        onChange={(e) => updateMachineField(idx, 'model', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        placeholder="Ano"
                        value={item.year || ''}
                        onChange={(e) => updateMachineField(idx, 'year', Number(e.target.value))}
                        className="h-8 text-xs bg-white text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="Chassi"
                        value={item.chassi || ''}
                        onChange={(e) => updateMachineField(idx, 'chassi', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={item.value || ''}
                        onChange={(e) => updateMachineField(idx, 'value', Number(e.target.value))}
                        className="h-8 text-xs font-bold bg-white text-right"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMachine(idx)}
                        className="h-7 w-7 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="text-xs h-10 px-5 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar: Dados Fundiários
        </Button>
        <Button
          type="button"
          onClick={onAdvance}
          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-xs"
        >
          Avançar: Benfeitorias & Rebanho
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
