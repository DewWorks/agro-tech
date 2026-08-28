'use client'

import { useState } from 'react'
import { updateOrganization } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

const organizationSchema = z.object({
  name: z.string().min(2, 'A Razão Social deve ter pelo menos 2 caracteres.'),
  cnpj: z.string().min(14, 'CNPJ deve ter pelo menos 14 caracteres.'),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

export default function OrganizationForm({ organization, isOwner }: { organization: any, isOwner: boolean }) {
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name || '',
      cnpj: organization.cnpj || '',
    },
  })

  async function onSubmit(data: OrganizationFormValues) {
    if (!isOwner) return

    setIsPending(true)
    
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('cnpj', data.cnpj)

    const result = await updateOrganization(formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Organização atualizada com sucesso!')
    }
    
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Razão Social / Nome</Label>
        <Input 
          id="name" 
          {...register('name')} 
          placeholder="Nome da sua empresa" 
          disabled={!isOwner}
          className={!isOwner ? 'bg-gray-100 text-gray-500' : ''}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input 
          id="cnpj" 
          {...register('cnpj')} 
          placeholder="00.000.000/0000-00" 
          disabled={!isOwner}
          className={!isOwner ? 'bg-gray-100 text-gray-500' : ''}
        />
        {errors.cnpj && (
          <p className="text-xs text-red-500">{errors.cnpj.message}</p>
        )}
      </div>

      {isOwner && (
        <Button 
          type="submit" 
          className="bg-[#1B4D3E] hover:bg-[#13382D]"
          disabled={isPending}
        >
          {isPending ? 'A Guardar...' : 'Guardar Alterações'}
        </Button>
      )}
    </form>
  )
}
