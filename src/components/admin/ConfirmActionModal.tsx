'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ConfirmActionModalProps {
  title: string
  description: string
  triggerText: string
  triggerIcon?: React.ReactNode
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
  action: () => Promise<{ success?: boolean; error?: string }>
  successMessage: string
  actionLabel?: string
  actionVariant?: 'default' | 'destructive'
}

export function ConfirmActionModal({
  title,
  description,
  triggerText,
  triggerIcon,
  triggerVariant = 'outline',
  triggerSize = 'sm',
  action,
  successMessage,
  actionLabel = 'Confirmar',
  actionVariant = 'default'
}: ConfirmActionModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const result = await action()
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(successMessage)
        setOpen(false)
        router.refresh() // Força o refresh da rota no lado do cliente
      }
    } catch (err: any) {
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        <div className="inline-block">
          <Button variant={triggerVariant} size={triggerSize}>
            {triggerIcon ? triggerIcon : triggerText}
          </Button>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button 
            variant={actionVariant} 
            onClick={handleAction} 
            disabled={isPending}
            className={actionVariant === 'default' ? 'bg-[#1B4D3E] hover:bg-[#13382D]' : ''}
          >
            {isPending ? 'Aguarde...' : actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
