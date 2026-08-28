'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { createBranch, updateBranch } from '@/actions/branches'
import { toast } from 'sonner'
import { Branch } from '@prisma/client'

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  cnpj: z.string().min(14, 'O CNPJ deve ter no mínimo 14 caracteres.'),
  city: z.string().min(2, 'A cidade deve ter pelo menos 2 caracteres.'),
  state: z.string().min(2, 'A UF deve ter pelo menos 2 caracteres.'),
  isActive: z.boolean(),
})

interface BranchFormProps {
  initialData?: Branch | null
}

export function BranchForm({ initialData }: BranchFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      cnpj: initialData?.cnpj || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      isActive: initialData ? initialData.isActive : true,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('cnpj', values.cnpj)
    formData.append('city', values.city)
    formData.append('state', values.state)
    formData.append('isActive', values.isActive ? 'on' : 'false')

    let result
    if (initialData) {
      result = await updateBranch(initialData.id, formData)
    } else {
      result = await createBranch(formData)
    }

    if (result?.error) {
      toast.error(result.error)
      setIsPending(false)
    } else {
      toast.success(initialData ? 'Filial atualizada!' : 'Filial criada com sucesso!')
      router.push('/admin/branches')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Filial</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Matriz São Paulo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000/0000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Ribeirão Preto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado (UF)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: SP" maxLength={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as any}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Filial Ativa</FormLabel>
                <FormDescription>
                  Se desativada, a filial não aparecerá nos sistemas de cadastro e operações.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-[#1B4D3E] hover:bg-[#13382D]"
            disabled={isPending}
          >
            {isPending ? 'A salvar...' : 'Salvar Filial'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
