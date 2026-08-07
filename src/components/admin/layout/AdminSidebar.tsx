import Link from 'next/link'
import { Building2, Users, LayoutDashboard } from 'lucide-react'

export default function AdminSidebar({ role }: { role: string }) {
  return (
    <div className="w-64 bg-[#1B4D3E] text-white flex flex-col h-full shadow-lg">
      <div className="p-6 border-b border-white/10 flex items-center justify-center">
        <h1 className="text-xl font-bold tracking-wider">AGRO<span className="font-light">TECH</span></h1>
        <div className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold uppercase">ADMIN</div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/admin/branches" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
          <Building2 size={20} />
          Gestão de Filiais
        </Link>
        <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
          <Users size={20} />
          Utilizadores e Acessos
        </Link>
      </nav>
      <div className="p-4 border-t border-white/10">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium opacity-80 hover:opacity-100">
          <LayoutDashboard size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
