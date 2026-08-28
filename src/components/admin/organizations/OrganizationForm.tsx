'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import { createOrganization } from '@/actions/organizations'
import { toast } from 'sonner'
import { Building2, User } from 'lucide-react'

export function OrganizationForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setWarning(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    
    const result = await createOrganization(formData)

    if (result?.error) {
      setError(result.error)
      toast.error('Ocorreu um erro ao criar organização.')
      setIsPending(false)
    } else if ((result as any)?.warning) {
      setWarning((result as any).warning)
      setIsPending(false)
    } else {
      setSuccess('Organização e utilizador criados com sucesso! O utilizador receberá um e-mail com a password temporária.')
      setIsPending(false)
    }
  }

  if (success || warning) {
    return (
      <div className="space-y-6">
        {success && <FormAlert type="success" message={success} />}
        {warning && <FormAlert type="warning" message={warning} />}
        
        <div className="flex gap-4 mt-6">
          <Button onClick={() => router.push('/admin/organizations')} className="bg-[#1B4D3E] hover:bg-[#13382D]">
            Voltar para Listagem
          </Button>
          <Button variant="outline" onClick={() => {
            setSuccess(null)
            setWarning(null)
          }}>
            Criar Outra Organização
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormAlert type="error" message={error || ''} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dados da Organização */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Building2 className="h-5 w-5 text-[#1B4D3E]" />
            <h3 className="text-lg font-medium">Dados da Empresa</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orgName">Nome da Organização</Label>
            <Input 
              id="orgName"
              name="orgName"
              placeholder="Ex: Fazenda Boa Esperança" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgCnpj">CNPJ</Label>
            <Input 
              id="orgCnpj"
              name="orgCnpj"
              placeholder="Apenas números" 
              required 
            />
          </div>
        </div>

        {/* Dados do Owner */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <User className="h-5 w-5 text-[#1B4D3E]" />
            <h3 className="text-lg font-medium">Acesso Principal (OWNER)</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ownerName">Nome Completo</Label>
            <Input 
              id="ownerName"
              name="ownerName"
              placeholder="João Silva" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerEmail">E-mail</Label>
            <Input 
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              placeholder="usuario@agrotech.com" 
              required 
            />
            <p className="text-xs text-muted-foreground">
              Uma senha temporária será gerada e enviada para este e-mail.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
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
          {isPending ? 'A salvar...' : 'Salvar Organização'}
        </Button>
      </div>
    </form>
  )
}
