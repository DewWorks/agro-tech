'use client'

import { useState } from 'react'
import { updateProfile } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

const profileSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileForm({ user, email }: { user: any, email: string }) {
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || '',
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsPending(true)
    
    const formData = new FormData()
    formData.append('fullName', data.fullName)

    const result = await updateProfile(formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Perfil atualizado com sucesso!')
    }
    
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail (Não editável)</Label>
        <Input 
          id="email" 
          value={email} 
          disabled 
          className="bg-gray-100 text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input 
          id="fullName" 
          {...register('fullName')} 
          placeholder="Insira o seu nome" 
        />
        {errors.fullName && (
          <p className="text-xs text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="bg-[#1B4D3E] hover:bg-[#13382D]"
        disabled={isPending}
      >
        {isPending ? 'A Guardar...' : 'Guardar Alterações'}
      </Button>
    </form>
  )
}
