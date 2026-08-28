import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormAlertProps {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  className?: string
}

export function FormAlert({ type, message, className }: FormAlertProps) {
  if (!message) return null

  const config = {
    success: {
      icon: CheckCircle2,
      style: 'bg-green-50 text-green-800 border-green-200',
      iconStyle: 'text-green-600'
    },
    error: {
      icon: AlertCircle,
      style: 'bg-red-50 text-red-800 border-red-200',
      iconStyle: 'text-red-600'
    },
    info: {
      icon: Info,
      style: 'bg-blue-50 text-blue-800 border-blue-200',
      iconStyle: 'text-blue-600'
    },
    warning: {
      icon: AlertTriangle,
      style: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      iconStyle: 'text-yellow-600'
    }
  }

  const { icon: Icon, style, iconStyle } = config[type]

  return (
    <div className={cn('flex items-start gap-3 p-3 text-sm border rounded-md', style, className)}>
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconStyle)} />
      <div className="flex-1">
        <p>{message}</p>
      </div>
    </div>
  )
}
