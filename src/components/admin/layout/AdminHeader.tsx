import { Bell, LogOut, Settings, User as UserIcon, Building2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminHeader({ email, role }: { email: string, role: string }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">Definições do Sistema</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-[#1B4D3E] transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="border-l pl-4 border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
              <div className="w-9 h-9 rounded-full bg-[#1B4D3E] flex items-center justify-center text-white font-bold text-sm tracking-widest cursor-pointer hover:bg-[#13382D] transition-colors">
                {email?.substring(0,2).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm text-left">
                <p className="font-medium text-gray-900 leading-tight">{email}</p>
                <p className="text-xs text-gray-500 font-semibold">{role}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Link href="/admin/settings/profile" className="flex items-center cursor-pointer w-full">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </Link>
              </DropdownMenuItem>
              {role === 'OWNER' && (
                <DropdownMenuItem>
                  <Link href="/admin/settings/organization" className="flex items-center cursor-pointer w-full">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Minha Empresa</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                <form action="/auth/signout" method="POST" className="w-full">
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>

          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
