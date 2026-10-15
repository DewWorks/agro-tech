'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PixCopyButtonProps {
  payload: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function PixCopyButton({
  payload,
  className,
  variant = 'outline',
  size = 'sm',
}: PixCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      toast.success('Código Pix Copia e Cola copiado!')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('Erro ao copiar para a área de transferência')
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1 text-emerald-600" />
          <span className="text-emerald-700 font-medium">Copiado</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-1" />
          <span>Copiar Pix</span>
        </>
      )}
    </Button>
  )
}
