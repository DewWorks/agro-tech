'use client'

import { useEffect, useState, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { UniversalPageSkeleton } from '@/components/ui/skeletons'

export default function AdminContentWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  // Quando a nova rota termina de carregar, volta a exibir o conteúdo normal
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  // Disparo instantâneo ao clicar em qualquer link do sistema
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (
        href &&
        href.startsWith('/admin') &&
        !target.hasAttribute('target') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const currentUrl = window.location.pathname + window.location.search
        if (href !== currentUrl) {
          setIsNavigating(true)
        }
      }
    }

    document.addEventListener('click', handleLinkClick, { capture: true })
    return () => document.removeEventListener('click', handleLinkClick, { capture: true })
  }, [])

  return (
    <div className="w-full relative min-h-full">
      {isNavigating ? (
        <div className="animate-in fade-in duration-100">
          <UniversalPageSkeleton />
        </div>
      ) : (
        <div className="animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  )
}
