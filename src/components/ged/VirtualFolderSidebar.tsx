'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Folder, Search, CheckCircle2, XCircle, ListFilter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProducerFolder {
  id: string
  name: string
  branchId: string
  isActive: boolean
  _count: {
    documents: number
  }
}

interface VirtualFolderSidebarProps {
  producers: ProducerFolder[]
  selectedFolderId?: string
}

export default function VirtualFolderSidebar({
  producers,
  selectedFolderId,
}: VirtualFolderSidebarProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ativos')

  const filteredProducers = useMemo(() => {
    return producers.filter(p => {
      // Filtro de status
      if (statusFilter === 'ativos' && !p.isActive) return false
      if (statusFilter === 'inativos' && p.isActive) return false
      
      // Busca por nome
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [producers, search, statusFilter])

  return (
    <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-lg border shadow-sm p-4 sticky top-6 flex flex-col h-[calc(100vh-120px)]">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex-shrink-0">
        Pastas Virtuais
      </h3>
      
      <div className="space-y-3 mb-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar pasta..." 
            className="pl-8 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'todos')}>
          <SelectTrigger className="h-8 text-xs bg-gray-50/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-xs">
              <div className="flex items-center gap-2">
                <ListFilter className="h-3.5 w-3.5 text-gray-500" />
                <span>Todos</span>
              </div>
            </SelectItem>
            <SelectItem value="ativos" className="text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Ativos</span>
              </div>
            </SelectItem>
            <SelectItem value="inativos" className="text-xs">
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-600" />
                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Inativos</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {filteredProducers.length === 0 ? (
          <p className="text-sm text-gray-500 italic mt-4 text-center">Nenhuma pasta encontrada.</p>
        ) : (
          filteredProducers.map(producer => {
            const isSelected = producer.id === selectedFolderId
            return (
              <Link 
                key={producer.id} 
                href={`/admin/ged/explorer?folderId=${producer.id}`}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                  isSelected 
                    ? "bg-[#1B4D3E]/10 text-[#1B4D3E] font-medium" 
                    : "text-gray-600 hover:bg-gray-100",
                  !producer.isActive && !isSelected && "opacity-60"
                )}
                title={producer.name}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className={cn("h-4 w-4 flex-shrink-0", isSelected ? "text-[#1B4D3E]" : "text-gray-400")} />
                  <span className="truncate">{producer.name}</span>
                </div>
                {producer._count.documents > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2",
                    isSelected ? "bg-[#1B4D3E]/20 text-[#1B4D3E]" : "bg-gray-100 text-gray-500"
                  )}>
                    {producer._count.documents}
                  </span>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
