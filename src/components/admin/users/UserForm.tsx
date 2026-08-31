'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { FormAlert } from '@/components/ui/form-alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUser, updateUser } from '@/actions/users'
import { toast } from 'sonner'
import { Branch, Role } from '@prisma/client'

// Tipos baseados no que o Prisma e nossa API retornam
interface UserBranchData {
  branchId: string
  role: Role
}

interface UserData {
  id: string
  email: string
  fullName: string | null
  role: Role
  isActive: boolean
  userBranches: UserBranchData[]
}

interface UserFormProps {
  initialData?: UserData | null
  branches: Branch[] // Lista de todas as filiais ativas da organização
}

export function UserForm({ initialData, branches }: UserFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estado do formulário
  const [email, setEmail] = useState(initialData?.email || '')
  const [fullName, setFullName] = useState(initialData?.fullName || '')
  const [globalRole, setGlobalRole] = useState<Role>(initialData?.role || 'OPERATOR')
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true)
  
  // Controle das filiais selecionadas: branchId -> role
  const [selectedBranches, setSelectedBranches] = useState<Record<string, Role>>(() => {
    const initial: Record<string, Role> = {}
    if (initialData?.userBranches) {
      initialData.userBranches.forEach(ub => {
        initial[ub.branchId] = ub.role
      })
    }
    return initial
  })

  const handleBranchToggle = (branchId: string, checked: boolean) => {
    setSelectedBranches(prev => {
      const next = { ...prev }
      if (checked) {
        next[branchId] = 'OPERATOR' // Default role ao selecionar
      } else {
        delete next[branchId]
      }
      return next
    })
  }

  const handleBranchRoleChange = (branchId: string, role: Role) => {
    setSelectedBranches(prev => ({
      ...prev,
      [branchId]: role
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    // Preparar o array de filiais
    const branchesArray = Object.entries(selectedBranches).map(([branchId, role]) => ({
      branchId,
      role
    }))

    const payload = {
      email,
      fullName,
      role: globalRole,
      isActive,
      branches: branchesArray
    }

    let result
    if (initialData) {
      result = await updateUser(initialData.id, payload)
    } else {
      result = await createUser(payload)
    }

    if (result?.error) {
      setError(result.error)
      toast.error('Ocorreu um erro.')
      setIsPending(false)
    } else if ((result as any)?.warning) {
      setWarning((result as any).warning)
      setIsPending(false)
    } else {
      if ('tempPassword' in (result || {})) {
        setSuccess(`Utilizador criado com sucesso! Foi gerada e enviada a senha temporária: ${(result as any).tempPassword}`)
      } else {
        setSuccess('Dados do utilizador atualizados com sucesso!')
      }
      setIsPending(false)
    }
  }

  if (success || warning) {
    return (
      <div className="space-y-6">
        {success && <FormAlert type="success" message={success} />}
        {warning && <FormAlert type="warning" message={warning} />}
        
        <div className="flex gap-4 mt-6">
          <Button onClick={() => router.push('/admin/users')} className="bg-[#1B4D3E] hover:bg-[#13382D]">
            Voltar para Listagem
          </Button>
          {(warning || success) && !initialData && (
            <Button variant="outline" onClick={() => {
              setSuccess(null)
              setWarning(null)
              setEmail('')
              setFullName('')
            }}>
              Criar Outro Utilizador
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormAlert type="error" message={error || ''} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Dados Pessoais</h3>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!!initialData} // E-mail não muda após criado (limitação comum)
              placeholder="usuario@agrotech.com" 
              required 
            />
            {!initialData && (
              <p className="text-xs text-muted-foreground">
                Uma senha temporária será gerada automaticamente.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input 
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="João Silva" 
              required 
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <Label>Usuário Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Permite o login no sistema.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Permissões de Acesso</h3>
          
          <div className="space-y-2">
            <Label>Cargo Global</Label>
            <Select value={globalRole} onValueChange={(val) => setGlobalRole(val as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo global" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">Administrador (Proprietário)</SelectItem>
                <SelectItem value="ADMIN">Gerente</SelectItem>
                <SelectItem value="OPERATOR">Usuário</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-2 p-3 bg-slate-50 dark:bg-slate-900 border rounded-md">
              <strong className="block mb-2 text-slate-700 dark:text-slate-300">Permissões deste cargo no sistema:</strong>
              
              {globalRole === 'OWNER' && (
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Acesso Global:</strong> Acesso automático e irrestrito a todas as filiais da empresa.</li>
                  <li><strong>Telas Administrativas:</strong> Acesso total ao menu de Configurações, Gestão de Organização, Filiais e Utilizadores.</li>
                  <li><strong>Operações:</strong> Pode criar, editar e excluir permanentemente qualquer tipo de registo (Filiais, Utilizadores, etc).</li>
                  <li><strong>Telas Operacionais:</strong> Acesso total a CRM, Dashboard e todos os relatórios do sistema.</li>
                </ul>
              )}
              
              {globalRole === 'ADMIN' && (
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Acesso Local:</strong> Acesso restrito apenas às filiais às quais for explicitamente atribuído.</li>
                  <li><strong>Telas Administrativas:</strong> Acesso à Gestão de Utilizadores (apenas para gerir acessos nas suas filiais). Sem acesso a Configurações Globais ou Filiais.</li>
                  <li><strong>Operações:</strong> Pode gerir dados operacionais, mas não pode apagar filiais ou configurações da organização.</li>
                  <li><strong>Telas Operacionais:</strong> Acesso ao CRM, Dashboard e Relatórios referentes apenas às suas filiais.</li>
                </ul>
              )}
              
              {globalRole === 'OPERATOR' && (
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Acesso Local:</strong> Acesso restrito apenas às filiais às quais for explicitamente atribuído.</li>
                  <li><strong>Telas Administrativas:</strong> Nenhum acesso. O menu de Gestão e Configurações não estará visível.</li>
                  <li><strong>Operações:</strong> Pode realizar o trabalho diário (ex: criar e atualizar contactos/negócios), mas sem permissão de exclusão (apagar dados).</li>
                  <li><strong>Telas Operacionais:</strong> Acesso restrito às telas de operação diária (CRM e afins) das suas filiais.</li>
                </ul>
              )}
            </div>
          </div>

          {globalRole !== 'OWNER' && (
            <div className="space-y-3 pt-4 border-t">
              <Label>Acesso por Filial</Label>
              {branches.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhuma filial ativa encontrada.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {branches.map(branch => {
                    const isSelected = !!selectedBranches[branch.id]
                    return (
                      <div key={branch.id} className="flex items-center justify-between p-3 border rounded-md bg-slate-50/50">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id={`branch-${branch.id}`} 
                            checked={isSelected}
                            onCheckedChange={(checked) => handleBranchToggle(branch.id, checked as boolean)}
                          />
                          <Label htmlFor={`branch-${branch.id}`} className="font-normal cursor-pointer">
                            {branch.name}
                          </Label>
                        </div>
                        
                        {isSelected && (
                          <div className="w-36">
                            <Select 
                              value={selectedBranches[branch.id]} 
                              onValueChange={(val) => handleBranchRoleChange(branch.id, val as Role)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Gerente</SelectItem>
                                <SelectItem value="OPERATOR">Usuário</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
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
          {isPending ? 'A salvar...' : 'Salvar Utilizador'}
        </Button>
      </div>
    </form>
  )
}
