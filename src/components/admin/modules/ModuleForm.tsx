'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, ArrowLeft } from 'lucide-react'
import { createSystemModule, updateSystemModule } from '@/actions/modules'
import { toast } from 'sonner'
import Link from 'next/link'

export function ModuleForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      isActive: formData.get('isActive') === 'on',
    }

    try {
      if (initialData?.id) {
        await updateSystemModule(initialData.id, data)
        toast.success('Módulo atualizado com sucesso!')
      } else {
        await createSystemModule(data)
        toast.success('Módulo criado com sucesso!')
      }
      router.push('/admin/modules')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-sm border">
      <div className="space-y-4">
        <div>
          <Label htmlFor="code" className="text-[#1B4D3E] font-medium">Código do Módulo</Label>
          <Input 
            id="code" 
            name="code" 
            required 
            defaultValue={initialData?.code} 
            disabled={!!initialData?.id} // Não permite alterar o código se já existir
            className="mt-1"
            placeholder="Ex: CRM, GED, FINANCEIRO..."
            style={{ textTransform: 'uppercase' }}
          />
          <p className="text-xs text-muted-foreground mt-1">Este código será usado internamente pelo sistema. Não utilize espaços.</p>
        </div>

        <div>
          <Label htmlFor="name" className="text-[#1B4D3E] font-medium">Nome de Apresentação</Label>
          <Input 
            id="name" 
            name="name" 
            required 
            defaultValue={initialData?.name} 
            className="mt-1"
            placeholder="Ex: CRM Agronegócio"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-[#1B4D3E] font-medium">Descrição</Label>
          <Textarea 
            id="description" 
            name="description" 
            defaultValue={initialData?.description} 
            className="mt-1 h-24"
            placeholder="Descreva a finalidade deste módulo..."
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
          <div>
            <Label htmlFor="isActive" className="text-base font-semibold text-[#1B4D3E]">Status Global</Label>
            <p className="text-sm text-muted-foreground">O módulo estará disponível para ativação pelas organizações?</p>
          </div>
          <Switch 
            id="isActive" 
            name="isActive" 
            defaultChecked={initialData ? initialData.isActive : true} 
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <Link href="/admin/modules" className="flex-1">
          <Button type="button" variant="outline" className="w-full" disabled={loading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </Link>
        <Button type="submit" className="flex-1 bg-[#1B4D3E] hover:bg-[#13382D]" disabled={loading}>
          <Save className="mr-2 h-4 w-4" /> {loading ? 'A salvar...' : 'Salvar Módulo'}
        </Button>
      </div>
    </form>
  )
}
