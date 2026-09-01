'use client'

import { Search, Filter, Plus, Download, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOCUMENT_TYPE_LABELS } from '@/lib/ged/semaphore'

interface DocumentToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  onNewDocument?: () => void
  selectedCount: number
  onBatchDownload?: () => void
}

export default function DocumentToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onNewDocument,
  selectedCount,
  onBatchDownload,
}: DocumentToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Left: Filters */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar documento..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(val) => onStatusFilterChange(val ?? 'TODOS')}>
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os Status</SelectItem>
            <SelectItem value="VALIDO">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#16A34A]/10 text-[#16A34A]">
                <CheckCircle2 size={12} />
                Válidos
              </div>
            </SelectItem>
            <SelectItem value="ALERTA">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#EAB308]/10 text-[#EAB308]">
                <AlertTriangle size={12} />
                Em Alerta
              </div>
            </SelectItem>
            <SelectItem value="VENCIDO">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#DC2626]/10 text-[#DC2626]">
                <XCircle size={12} />
                Vencidos
              </div>
            </SelectItem>
            <SelectItem value="INDEFINIDO">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#94A3B8]/10 text-[#94A3B8]">
                <MinusCircle size={12} />
                Sem Validade
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(val) => onTypeFilterChange(val ?? 'TODOS')}>
          <SelectTrigger className="h-9 w-[220px] text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="TODOS">Todas as Categorias</SelectItem>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {selectedCount > 0 && onBatchDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBatchDownload}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Baixar {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
          </Button>
        )}
        {onNewDocument && (
          <Button
            size="sm"
            className="bg-[#1B4D3E] hover:bg-[#13382D]"
            onClick={onNewDocument}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Documento
          </Button>
        )}
      </div>
    </div>
  )
}
