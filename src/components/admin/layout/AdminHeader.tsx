import { Bell } from 'lucide-react'
import { User } from '@supabase/supabase-js'

export default function AdminHeader({ user }: { user: User }) {
  const role = user.app_metadata?.role || 'ADMIN'
  const email = user.email

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
        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
          <div className="w-9 h-9 rounded-full bg-[#1B4D3E] flex items-center justify-center text-white font-bold text-sm tracking-widest">
            {email?.substring(0,2).toUpperCase()}
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-gray-900 leading-tight">{email}</p>
            <p className="text-xs text-gray-500 font-semibold">{role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
