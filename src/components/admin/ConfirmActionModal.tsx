'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface ConfirmActionModalProps {
  title: string
  description: string
  triggerText?: string
  triggerIcon?: React.ReactNode
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
  useSwitch?: boolean
  isActive?: boolean
  tooltip?: string
  action: () => Promise<{ success?: boolean; error?: string; tempPassword?: string; warning?: string }>
  successMessage: string
  actionLabel?: string
  actionVariant?: 'default' | 'destructive'
}

export function ConfirmActionModal({
  title,
  description,
  triggerText,
  triggerIcon,
  triggerVariant = 'ghost',
  triggerSize = 'sm',
  useSwitch = false,
  isActive = false,
  tooltip,
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
        if (result?.tempPassword) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span>{successMessage}</span>
              <div className="mt-2 bg-slate-100 dark:bg-slate-800 p-2 rounded flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Nova senha temporária:</span>
                <span className="font-mono font-bold text-sm text-[#1B4D3E] select-all">{result.tempPassword}</span>
              </div>
            </div>,
            { duration: 15000 }
          )
        } else if (result?.warning) {
          toast.warning(result.warning)
        } else {
          toast.success(successMessage)
        }
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
    <Dialog open={open} onOpenChange={setOpen}>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger 
            {...({ nativeButton: false } as any)}
            render={
              <DialogTrigger 
                {...({ nativeButton: false } as any)}
                render={
                  useSwitch ? (
                    <Switch checked={isActive} className="cursor-pointer" />
                  ) : (
                    <Button 
                      variant={triggerVariant} 
                      size={triggerSize} 
                      className="cursor-pointer" 
                    />
                  )
                }
              />
            }
          >
            {useSwitch ? null : (triggerIcon ? triggerIcon : triggerText)}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger 
          {...({ nativeButton: false } as any)}
          render={
            useSwitch ? (
              <Switch checked={isActive} className="cursor-pointer" />
            ) : (
              <Button 
                variant={triggerVariant} 
                size={triggerSize} 
                className="cursor-pointer" 
              />
            )
          }
        >
          {useSwitch ? null : (triggerIcon ? triggerIcon : triggerText)}
        </DialogTrigger>
      )}
      <DialogContent className="border shadow-xl rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={isPending}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button 
            variant={actionVariant} 
            onClick={handleAction} 
            disabled={isPending}
            className={`cursor-pointer ${actionVariant === 'default' ? 'bg-[#1B4D3E] hover:bg-[#13382D]' : ''}`}
          >
            {isPending ? 'Aguarde...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
