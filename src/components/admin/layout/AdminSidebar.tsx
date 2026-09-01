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
  FileText,
  Tractor,
  Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  title: string
  icon: any
  href?: string
  badge?: string
  subItems?: { title: string; href: string }[]
}

const getMenuItems = (
  role: string, 
  modules: string[] = [], 
  realRole: string = role,
  globalModules: { code: string, isActive: boolean }[] = []
): MenuItem[] => {
  if (role === 'SUPER_ADMIN') {
    return [
      {
        title: 'SaaS / Clientes',
        icon: Building2,
        subItems: [
          { title: 'Gestão de Organizações', href: '/admin/organizations' },
          { title: 'Novo Cliente', href: '/admin/organizations/new' },
        ]
      },
      {
        title: 'Sistema Global',
        icon: Settings2,
        subItems: [
          { title: 'Gestão de Módulos', href: '/admin/modules' }
        ]
      },
      {
        title: 'Configurações',
        icon: Settings,
        subItems: [
          { title: 'Meu Perfil', href: '/admin/settings/profile' },
        ]
      }
    ]
  }

  const items: MenuItem[] = []

  const checkModule = (code: string) => {
    // Se globalModules estiver vazio (por falha ou não passado), assume true provisoriamente
    const isGloballyActive = globalModules.length === 0 ? true : (globalModules.find(m => m.code === code)?.isActive ?? true)
    const isClientActive = modules.includes(code)
    
    if (realRole !== 'SUPER_ADMIN') {
      if (isGloballyActive && isClientActive) {
        return { show: true, badge: undefined }
      }
      return { show: false, badge: undefined }
    }

    if (!isGloballyActive) {
      return { show: true, badge: 'OFF Global' }
    }
    if (!isClientActive) {
      return { show: true, badge: 'OFF Cliente' }
    }
    
    return { show: true, badge: undefined }
  }

  const crmStatus = checkModule('CRM')
  if (crmStatus.show) {
    items.push({
      title: 'CRM / Produtores',
      icon: Tractor,
      badge: crmStatus.badge,
      subItems: [
        { title: 'Listagem Geral', href: '/admin/crm' },
        { title: 'Novo Produtor', href: '/admin/crm/new' },
      ]
    })
  }

  const gedStatus = checkModule('GED')
  if (gedStatus.show) {
    items.push({
      title: 'Documentos (GED Inteligente)',
      icon: FolderTree,
      badge: gedStatus.badge,
      subItems: [
        { title: 'Explorador de Arquivos', href: '/admin/ged/explorer' },
        { title: 'Validades & Semáforo', href: '/admin/ged/semaphore' },
        { title: 'Declarações Legais', href: '/admin/documents/declarations' },
      ]
    })
  }

  items.push(
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
    {
      title: 'Configurações',
      icon: Settings,
      subItems: [
        { title: 'Meu Perfil', href: '/admin/settings/profile' },
        { title: 'Minha Empresa', href: '/admin/settings/organization' },
      ]
    }
  )

  return items
}

export default function AdminSidebar({ 
  role, 
  modules = [],
  realRole,
  globalModules = []
}: { 
  role: string, 
  modules?: string[],
  realRole?: string,
  globalModules?: { code: string, isActive: boolean }[]
}) {
  const pathname = usePathname()
  const actualRealRole = realRole || role
  // Estado para controlar quais os menus estão expandidos
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Filiais': pathname.includes('/admin/branches'),
    'Utilizadores': pathname.includes('/admin/users'),
    'Configurações': pathname.includes('/admin/settings'),
    'SaaS / Clientes': pathname.includes('/admin/organizations'),
    'Documentos (GED Inteligente)': pathname.includes('/admin/ged'),
  })

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const currentMenuItems = getMenuItems(role, modules, actualRealRole, globalModules)

  return (
    <div className="w-64 bg-[#1B4D3E] text-white flex flex-col h-full shadow-lg transition-all duration-300">
      
      {/* HEADER LOGO */}
      <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold tracking-wider">AGRO<span className="font-light">TECH</span></h1>
        <div className="mt-1 text-[10px] bg-white/20 px-3 py-1 rounded-full text-white font-bold uppercase tracking-widest flex items-center gap-1">
          <ShieldAlert size={10} />
          Painel {role === 'SUPER_ADMIN' ? 'GLOBAL' : role}
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
            <p className="px-4 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              {role === 'SUPER_ADMIN' ? 'Gestão de Clientes' : 'Gestão Principal'}
            </p>
            
            {currentMenuItems.map((item) => {
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
                        {item.badge && (
                          <span className="ml-1 text-[9px] uppercase font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
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
                      {item.badge && (
                        <span className="ml-1 text-[9px] uppercase font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* SUBITENS */}
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
    </div>
  )
}
