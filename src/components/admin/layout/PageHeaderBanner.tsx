import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PageHeaderBannerProps {
  /** Título principal da página */
  title: string
  /** Descrição explicativa abaixo do título */
  description?: string
  /** Etiqueta ou indicador superior (ex: Esteira Oficial • Banco do Brasil) */
  badge?: string
  /** Ícone temático que acompanha a etiqueta superior (Componente Lucide ou elemento ReactNode) */
  badgeIcon?: React.ReactNode | LucideIcon
  /** Ações principais do cabeçalho (ex: botões de novo cadastro, filtros, etc.) */
  actions?: React.ReactNode
  /** Classes CSS adicionais para customização opcional */
  className?: string
  /** Conteúdo filho adicional */
  children?: React.ReactNode
}

/**
 * Componente padronizado de cabeçalho executivo institucional para todas as telas do sistema AgroTech.
 * Apresenta superfície sólida no verde floresta corporativo com gradiente elegante (#1B4D3E -> #13382D),
 * tipografia branca de alto contraste e área flexível para botões de ação primária.
 * Pode ser utilizado tanto em Server Components quanto em Client Components.
 */
export function PageHeaderBanner({
  title,
  description,
  badge,
  badgeIcon,
  actions,
  className,
  children,
}: PageHeaderBannerProps) {
  const renderBadgeIcon = () => {
    if (!badgeIcon) return null
    if (React.isValidElement(badgeIcon)) {
      return badgeIcon
    }
    const IconComponent = badgeIcon as LucideIcon
    return <IconComponent className="h-4 w-4 shrink-0 text-emerald-300" />
  }

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4',
        'bg-gradient-to-r from-[#1B4D3E] to-[#13382D] text-white',
        'p-6 sm:p-8 rounded-2xl shadow-sm border border-emerald-900/40',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        {badge && (
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            {renderBadgeIcon()}
            <span className="truncate">{badge}</span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          {title}
        </h1>

        {description && (
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}

        {children}
      </div>

      {actions && (
        <div className="shrink-0 flex items-center gap-3 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeaderBanner
