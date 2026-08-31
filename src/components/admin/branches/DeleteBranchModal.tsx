'use client'

import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { Trash2 } from 'lucide-react'
import { deleteBranch } from '@/actions/branches'

interface DeleteBranchModalProps {
  branchId: string
  branchName: string
  counts: {
    users: number
    producers: number
    properties: number
  }
}

export function DeleteBranchModal({ branchId, branchName, counts }: DeleteBranchModalProps) {
  const hasLinks = counts.users > 0 || counts.producers > 0 || counts.properties > 0

  return (
    <ConfirmActionModal
      title="Excluir Filial?"
      description={
        hasLinks 
          ? `Atenção! Esta filial possui ${counts.users} utilizadores, ${counts.producers} produtores e ${counts.properties} propriedades vinculados. Ao excluí-la, o acesso a estes dados ficará oculto. Deseja mesmo excluir a filial ${branchName}?`
          : `Tem certeza que deseja excluir a filial ${branchName}? Esta ação ocultará a filial do sistema.`
      }
      triggerIcon={<Trash2 className="h-4 w-4 text-red-600" />}
      triggerVariant="ghost"
      triggerSize="icon"
      tooltip="Excluir Filial"
      action={async () => {
        return await deleteBranch(branchId)
      }}
      successMessage="Filial excluída com sucesso!"
      actionLabel="Excluir"
      actionVariant="destructive"
    />
  )
}
