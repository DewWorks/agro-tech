'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Quando a rota ou searchParams mudam, finaliza a barra de progresso
  useEffect(() => {
    if (isNavigating) {
      setProgress(100)
      const timer = setTimeout(() => {
        setIsNavigating(false)
        setProgress(0)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams])

  // Interceptar cliques em links internos para disparo instantâneo (<5ms)
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
          setProgress(25)
          // Incremento gradual para sensação orgânica de carregamento
          setTimeout(() => setProgress(prev => (prev > 0 && prev < 80 ? 65 : prev)), 100)
          setTimeout(() => setProgress(prev => (prev > 0 && prev < 90 ? 85 : prev)), 350)
        }
      }
    }

    document.addEventListener('click', handleLinkClick, { capture: true })
    return () => document.removeEventListener('click', handleLinkClick, { capture: true })
  }, [])

  if (!isNavigating && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-transparent overflow-hidden">
      <div 
        className="h-full bg-linear-to-r from-emerald-500 via-green-400 to-[#1B4D3E] transition-all duration-200 ease-out shadow-[0_0_8px_rgba(34,197,94,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 150ms ease-out, opacity 200ms ease-in' : 'width 250ms ease-out'
        }}
      />
    </div>
  )
}
