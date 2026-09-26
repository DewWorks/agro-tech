'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Tractor,
  ClipboardCheck,
  FolderArchive,
  FileSignature,
  FileCheck,
  Landmark,
  Building2,
  Users,
  Settings,
  Settings2,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubItem {
  title: string
  href: string
}

interface MenuItem {
  title: string
  icon: React.ElementType
  href?: string
  badge?: string
  subItems?: SubItem[]
}

interface NavGroup {
  label: string
  items: MenuItem[]
}

interface AdminSidebarProps {
  role: string
  modules?: string[]
  realRole?: string
  globalModules?: { code: string; isActive: boolean }[]
  organizationName?: string | null
  user?: {
    fullName?: string | null
    email?: string | null
    role?: string
  }
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  OWNER: 'Administrador (Proprietário)',
  ADMIN: 'Gerente Operacional',
  OPERATOR: 'Usuário do Sistema',
}

function getNavigationGroups(
  role: string,
  modules: string[] = [],
  realRole: string = role,
  globalModules: { code: string; isActive: boolean }[] = []
): NavGroup[] {
  // SUPER_ADMIN no painel Global SaaS (não impersonando cliente)
  if (role === 'SUPER_ADMIN') {
    return [
      {
        label: 'Visão Geral',
        items: [
          {
            title: 'Painel Geral',
            icon: LayoutDashboard,
            href: '/admin',
          },
        ],
      },
      {
        label: 'Gestão SaaS & Clientes',
        items: [
          {
            title: 'Organizações Clientes',
            icon: Building2,
            href: '/admin/organizations',
          },
          {
            title: 'Serviços & Demandas',
            icon: ClipboardCheck,
            href: '/admin/demands',
          },
        ],
      },
      {
        label: 'Documental & Crédito',
        items: [
          {
            title: 'Painel GED Global',
            icon: FolderArchive,
            href: '/admin/ged-global',
          },
          {
            title: 'Projetos de Crédito',
            icon: FileCheck,
            href: '/admin/documents/credit-projects',
          },
          {
            title: 'Limite de Crédito',
            icon: Landmark,
            href: '/admin/credit-limit',
          },
        ],
      },
      {
        label: 'Governança & Sistema',
        items: [
          {
            title: 'Módulos do Sistema',
            icon: Settings2,
            href: '/admin/modules',
          },
          {
            title: 'Configurações',
            icon: Settings,
            subItems: [
              { title: 'Meu Perfil', href: '/admin/settings/profile' },
            ],
          },
        ],
      },
    ]
  }

  // Verificação de módulos para clientes da organização
  const checkModule = (code: string) => {
    const isGloballyActive =
      globalModules.length === 0
        ? true
        : globalModules.find((m) => m.code === code)?.isActive ?? true
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

  // 1. Grupo Visão Geral
  const overviewGroup: NavGroup = {
    label: 'Visão Geral',
    items: [
      {
        title: 'Painel Geral',
        icon: LayoutDashboard,
        href: '/admin',
      },
    ],
  }

  // 2. Grupo Operação Agropecuária
  const operationsItems: MenuItem[] = []
  const crmStatus = checkModule('CRM')
  if (crmStatus.show) {
    operationsItems.push({
      title: 'CRM de Produtores',
      icon: Tractor,
      badge: crmStatus.badge,
      subItems: [
        { title: 'Produtores Rurais', href: '/admin/crm' },
        { title: 'Propriedades Rurais', href: '/admin/crm/properties' },
      ],
    })
  }

  const demandsStatus = checkModule('DEMANDS')
  if (demandsStatus.show) {
    operationsItems.push({
      title: 'Serviços & Demandas',
      icon: ClipboardCheck,
      badge: demandsStatus.badge,
      href: '/admin/demands',
    })
  }

  const operationsGroup: NavGroup = {
    label: 'Operação Agropecuária',
    items: operationsItems,
  }

  // 3. Grupo Documental & Crédito
  const docCreditItems: MenuItem[] = []
  const gedStatus = checkModule('GED')
  if (gedStatus.show) {
    docCreditItems.push({
      title: 'GED Enterprise',
      icon: FolderArchive,
      badge: gedStatus.badge,
      subItems: [
        { title: 'Explorador de Arquivos', href: '/admin/documents' },
        { title: 'Painel & Validades', href: '/admin/dashboard/owner' },
      ],
    })

    docCreditItems.push({
      title: 'Projetos de Crédito',
      icon: FileCheck,
      badge: gedStatus.badge,
      href: '/admin/documents/credit-projects',
    })

    docCreditItems.push({
      title: 'Minutas & Declarações',
      icon: FileSignature,
      badge: gedStatus.badge,
      href: '/admin/documents/declarations',
    })
  }

  const financialStatus = checkModule('FINANCIAL_SUMMARY')
  if (financialStatus.show) {
    docCreditItems.push({
      title: 'Limite de Crédito',
      icon: Landmark,
      badge: financialStatus.badge,
      href: '/admin/credit-limit',
    })
  }

  const docCreditGroup: NavGroup = {
    label: 'Documental & Crédito',
    items: docCreditItems,
  }

  // 4. Grupo Governança & Sistema
  const governanceItems: MenuItem[] = [
    {
      title: 'Filiais',
      icon: Building2,
      href: '/admin/branches',
    },
    {
      title: 'Usuários',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Configurações',
      icon: Settings,
      subItems: [
        { title: 'Meu Perfil', href: '/admin/settings/profile' },
        ...(role === 'OWNER'
          ? [{ title: 'Minha Empresa', href: '/admin/settings/organization' }]
          : []),
      ],
    },
  ]

  const governanceGroup: NavGroup = {
    label: 'Governança & Sistema',
    items: governanceItems,
  }

  return [overviewGroup, operationsGroup, docCreditGroup, governanceGroup]
}

/**
 * Determina se uma rota deve ser considerada ativa comparando a URL atual com o href do item.
 * Evita colisões de prefixo entre rotas irmãs (como /admin/documents e /admin/documents/credit-projects)
 * e entre itens pai e filhos específicos (como /admin/crm e /admin/crm/properties).
 */
function isRouteActive(itemHref: string, currentPath: string): boolean {
  if (!itemHref) return false

  // 1. Painel Geral: somente correspondência estrita com '/admin'
  if (itemHref === '/admin') {
    return currentPath === '/admin'
  }

  // 2. Produtores Rurais (/admin/crm):
  // Ativa se for '/admin/crm' ou rotas filhas diretas, mas NUNCA propriedades rurais
  if (itemHref === '/admin/crm') {
    if (currentPath === '/admin/crm') return true
    if (currentPath.startsWith('/admin/crm/')) {
      return !currentPath.startsWith('/admin/crm/properties')
    }
    return false
  }

  // 3. Propriedades Rurais (/admin/crm/properties):
  if (itemHref === '/admin/crm/properties') {
    return (
      currentPath === '/admin/crm/properties' ||
      currentPath.startsWith('/admin/crm/properties/')
    )
  }

  // 4. GED Explorador de Arquivos (/admin/documents):
  // Ativa se for '/admin/documents' ou '/admin/ged', mas NUNCA credit-projects ou declarations
  if (itemHref === '/admin/documents') {
    if (
      currentPath.startsWith('/admin/documents/credit-projects') ||
      currentPath.startsWith('/admin/documents/declarations')
    ) {
      return false
    }
    return (
      currentPath === '/admin/documents' ||
      currentPath.startsWith('/admin/documents/') ||
      currentPath === '/admin/ged' ||
      currentPath.startsWith('/admin/ged/')
    )
  }

  // 5. Projetos de Crédito (/admin/documents/credit-projects):
  if (itemHref === '/admin/documents/credit-projects') {
    return (
      currentPath === '/admin/documents/credit-projects' ||
      currentPath.startsWith('/admin/documents/credit-projects/')
    )
  }

  // 6. Minutas & Declarações (/admin/documents/declarations):
  if (itemHref === '/admin/documents/declarations') {
    return (
      currentPath === '/admin/documents/declarations' ||
      currentPath.startsWith('/admin/documents/declarations/')
    )
  }

  // 7. Regra padrão para demais rotas
  return currentPath === itemHref || currentPath.startsWith(itemHref + '/')
}

/**
 * Verifica se a rota atual pertence ao grupo GED Enterprise
 */
function isGedGroupActive(currentPath: string): boolean {
  if (
    currentPath.startsWith('/admin/documents/credit-projects') ||
    currentPath.startsWith('/admin/documents/declarations')
  ) {
    return false
  }
  return (
    currentPath === '/admin/documents' ||
    currentPath.startsWith('/admin/documents/') ||
    currentPath === '/admin/dashboard/owner' ||
    currentPath.startsWith('/admin/dashboard/owner/') ||
    currentPath === '/admin/ged' ||
    currentPath.startsWith('/admin/ged/')
  )
}

function isCrmGroupActive(currentPath: string): boolean {
  return currentPath === '/admin/crm' || currentPath.startsWith('/admin/crm/')
}

function isSettingsGroupActive(currentPath: string): boolean {
  return currentPath.startsWith('/admin/settings')
}

export default function AdminSidebar({
  role,
  modules = [],
  realRole,
  globalModules = [],
  organizationName,
  user,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const actualRealRole = realRole || role

  const groups = getNavigationGroups(role, modules, actualRealRole, globalModules)

  // Controle de menus retráteis expandidos sincronizado com a rota ativa
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'CRM de Produtores': isCrmGroupActive(pathname),
    'GED Enterprise': isGedGroupActive(pathname),
    Configurações: isSettingsGroupActive(pathname),
  })

  // Sincronização da rota ativa ao navegar
  useEffect(() => {
    setExpandedMenus({
      'CRM de Produtores': isCrmGroupActive(pathname),
      'GED Enterprise': isGedGroupActive(pathname),
      Configurações: isSettingsGroupActive(pathname),
    })
  }, [pathname])

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Extração das iniciais do usuário
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Gestor'
  const initials = (user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')
    : user?.email?.substring(0, 2).toUpperCase()) || 'AG'

  const userRoleLabel = ROLE_LABELS[user?.role || role] || role
  const orgSubtitle = organizationName || 'Gestão Agropecuária'

  return (
    <aside
      className="w-64 bg-[#1B4D3E] text-white flex flex-col h-full shrink-0 shadow-xl transition-all duration-300"
      aria-label="Menu Principal Administrativo"
    >
      {/* 2.A & 2.B. Identidade Institucional Tipográfica Limpa com Nome Dinâmico */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="block group">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white leading-none">
              Agro<span className="text-emerald-400 font-extrabold">Tech</span>
            </span>
            <span className="text-[10px] font-bold bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-widest">
              SaaS
            </span>
          </div>
          <p className="text-xs text-white/70 font-medium tracking-normal truncate mt-1.5 group-hover:text-white/90 transition-colors">
            {orgSubtitle}
          </p>
        </Link>
      </div>

      {/* 2.C. Navegação Enxuta e Ícones Padronizados em 4 Blocos */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <nav className="p-3.5 space-y-5">
          {groups.map((group) => {
            if (group.items.length === 0) return null

            return (
              <div key={group.label} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 select-none">
                  {group.label}
                </p>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isDirectActive = item.href ? isRouteActive(item.href, pathname) : false
                    const isSubItemActive = Boolean(
                      item.subItems?.some((sub) => isRouteActive(sub.href, pathname))
                    )
                    const isActive = isDirectActive || isSubItemActive
                    const isExpanded = expandedMenus[item.title]

                    // Item Retrátil com Subitens
                    if (item.subItems) {
                      return (
                        <div key={item.title} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => toggleMenu(item.title)}
                            aria-expanded={isExpanded}
                            className={cn(
                              'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-xs font-medium cursor-pointer',
                              isActive
                                ? 'bg-white/15 text-white font-semibold border-l-4 border-emerald-400 pl-2.5'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={cn(
                                  'w-4 h-4 shrink-0 transition-colors',
                                  isActive ? 'text-emerald-300' : 'text-white/70'
                                )}
                              />
                              <span className="truncate">{item.title}</span>
                              {item.badge && (
                                <span className="ml-1 text-[9px] uppercase font-bold bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-white/60 shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="ml-4 pl-3 border-l border-white/20 space-y-0.5 mt-1 mb-1.5">
                              {item.subItems.map((sub) => {
                                const isSubActive = isRouteActive(sub.href, pathname)
                                return (
                                  <Link
                                    key={sub.title}
                                    href={sub.href}
                                    prefetch={true}
                                    className={cn(
                                      'block px-3 py-1.5 rounded-lg transition-colors text-xs',
                                      isSubActive
                                        ? 'text-white bg-white/20 font-semibold shadow-xs border-l-2 border-emerald-400 pl-2.5'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
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
                    }

                    // Item Link Direto
                    return (
                      <Link
                        key={item.title}
                        href={item.href || '#'}
                        prefetch={true}
                        className={cn(
                          'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-xs font-medium',
                          isDirectActive
                            ? 'bg-white/15 text-white font-semibold shadow-xs border-l-4 border-emerald-400 pl-2.5'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isDirectActive ? 'text-emerald-300' : 'text-white/70'
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] uppercase font-bold bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {/* 2.D. Ergonomia e Rodapé com Perfil do Usuário e Logout */}
      <div className="p-3.5 border-t border-white/10 bg-black/15">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-white/70 truncate leading-tight mt-0.5">
                {userRoleLabel}
              </p>
            </div>
          </div>

          <form action="/auth/signout" method="POST" className="shrink-0">
            <button
              type="submit"
              title="Encerrar Sessão"
              aria-label="Encerrar Sessão"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
