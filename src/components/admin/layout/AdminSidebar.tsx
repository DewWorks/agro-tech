'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  Building2, 
  Users, 
  LayoutDashboard, 
  Home, 
  ChevronDown, 
  ChevronRight,
  ShieldAlert,
  Settings,
  FolderTree,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  title: string
  icon: any
  href?: string
  subItems?: { title: string; href: string }[]
}

const menuItems: MenuItem[] = [
  {
    title: 'Filiais',
    icon: Building2,
    subItems: [
      { title: 'Ver Todas', href: '/admin/branches' },
      { title: 'Nova Filial', href: '/admin/branches/new' },
    ]
  },
  {
    title: 'Utilizadores',
    icon: Users,
    subItems: [
      { title: 'Equipa e Acessos', href: '/admin/users' },
      { title: 'Novo Utilizador', href: '/admin/users/new' },
    ]
  },
  // Placeholders para futuros módulos
  {
    title: 'Configurações',
    icon: Settings,
    href: '/admin/settings',
  }
]

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  // Estado para controlar quais os menus estão expandidos
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Filiais': pathname.includes('/admin/branches'),
    'Utilizadores': pathname.includes('/admin/users'),
  })

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  return (
    <div className="w-64 bg-[#1B4D3E] text-white flex flex-col h-full shadow-lg transition-all duration-300">
      
      {/* HEADER LOGO */}
      <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold tracking-wider">AGRO<span className="font-light">TECH</span></h1>
        <div className="mt-1 text-[10px] bg-white/20 px-3 py-1 rounded-full text-white font-bold uppercase tracking-widest flex items-center gap-1">
          <ShieldAlert size={10} />
          Painel {role}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20">
        <nav className="px-4 py-6 space-y-6">
          
          {/* HOME PRINCIPAL - DESTACADA */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Visão Geral</p>
            <Link 
              href="/admin" 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                pathname === '/admin' ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Home size={20} />
              Home Admin
            </Link>
          </div>

          <div className="w-full h-px bg-white/10"></div>

          {/* MENU PRINCIPAL COM SUBMENUS */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Gestão Principal</p>
            
            {menuItems.map((item) => {
              const isActiveRoute = item.href ? pathname === item.href : item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href))
              const isExpanded = expandedMenus[item.title]

              return (
                <div key={item.title} className="space-y-1">
                  {item.subItems ? (
                    // Menu com Subitens
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                        isActiveRoute ? "text-white bg-white/10" : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className={isActiveRoute ? "text-green-400" : ""} />
                        {item.title}
                      </div>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  ) : (
                    // Menu Link Direto
                    <Link
                      href={item.href || '#'}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                        isActiveRoute ? "text-white bg-white/20" : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon size={20} className={isActiveRoute ? "text-green-400" : ""} />
                      {item.title}
                    </Link>
                  )}

                  {/* SUBITENS (Animados via CSS puramente com max-height se quiséssemos, mas aqui fazemos condicional simples) */}
                  {item.subItems && isExpanded && (
                    <div className="ml-4 pl-4 border-l border-white/20 space-y-1 mt-1 mb-2">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href
                        return (
                          <Link
                            key={sub.title}
                            href={sub.href}
                            className={cn(
                              "block px-4 py-2 rounded-md transition-colors text-sm",
                              isSubActive 
                                ? "text-white bg-white/10 font-medium" 
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                          >
                            {sub.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
      </div>

      {/* RODAPÉ DO SIDEBAR */}
      <div className="p-4 border-t border-white/10">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-white/70 hover:text-white"
        >
          <LayoutDashboard size={20} />
          Voltar ao App
        </Link>
      </div>
    </div>
  )
}
