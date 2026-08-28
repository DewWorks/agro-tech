'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Building2 } from 'lucide-react'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Meu Perfil', href: '/admin/settings/profile', icon: User },
    { name: 'Minha Empresa', href: '/admin/settings/organization', icon: Building2 },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E]">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie o seu perfil e as definições da sua empresa.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  isActive
                    ? 'border-[#1B4D3E] text-[#1B4D3E]'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium'
                )}
              >
                <tab.icon
                  className={cn(
                    isActive ? 'text-[#1B4D3E]' : 'text-gray-400 group-hover:text-gray-500',
                    '-ml-0.5 mr-2 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="pt-4">
        {children}
      </div>
    </div>
  )
}
