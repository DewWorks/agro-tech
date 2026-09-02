'use client'

import { useState, useTransition, useEffect, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Filter, ListFilter, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton, CardGridSkeleton } from '@/components/ui/skeletons'

export interface FilterOption {
  label: ReactNode
  value: string
}

export interface ExtraFilter {
  paramName: string
  placeholder?: string
  options: FilterOption[]
  defaultValue?: string
}

interface DataViewContainerProps {
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  filterParamName?: string
  extraFilters?: ExtraFilter[]
  showViewToggle?: boolean
  defaultView?: 'table' | 'cards'
  tableView: ReactNode
  cardsView?: ReactNode
}

export default function DataViewContainer({
  searchPlaceholder = "Buscar...",
  filterOptions,
  filterParamName = "status",
  extraFilters,
  showViewToggle = false,
  defaultView = 'table',
  tableView,
  cardsView
}: DataViewContainerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [viewMode, setViewMode] = useState<'table' | 'cards'>(defaultView)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filterValue, setFilterValue] = useState(searchParams.get(filterParamName) || 'TODOS')
  const [extraValues, setExtraValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {}
    extraFilters?.forEach(ef => {
      vals[ef.paramName] = searchParams.get(ef.paramName) || ef.defaultValue || 'TODOS'
    })
    return vals
  })

  // Sincronizar query params se a URL mudar externamente
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    setFilterValue(searchParams.get(filterParamName) || 'TODOS')
    const vals: Record<string, string> = {}
    extraFilters?.forEach(ef => {
      vals[ef.paramName] = searchParams.get(ef.paramName) || ef.defaultValue || 'TODOS'
    })
    setExtraValues(vals)
  }, [searchParams, filterParamName, extraFilters])

  const applyServerFilters = (newParamsObj: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      Object.entries(newParamsObj).forEach(([k, v]) => {
        if (v && v !== 'TODOS') {
          params.set(k, v)
        } else {
          params.delete(k)
        }
      })
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearch = () => {
    applyServerFilters({
      q: query || null,
      [filterParamName]: filterValue,
      ...extraValues
    })
  }

  const handleFilterChange = (val: string | null) => {
    const finalVal = val || 'TODOS'
    setFilterValue(finalVal)
    applyServerFilters({
      q: query || null,
      [filterParamName]: finalVal,
      ...extraValues
    })
  }

  const handleExtraFilterChange = (paramName: string, val: string | null) => {
    const finalVal = val || 'TODOS'
    setExtraValues(prev => ({ ...prev, [paramName]: finalVal }))
    applyServerFilters({
      q: query || null,
      [filterParamName]: filterValue,
      ...extraValues,
      [paramName]: finalVal
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4 w-full">
      
      {/* Unified Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="pl-9 h-9 bg-white"
            />
          </div>
          
          {filterOptions && filterOptions.length > 0 && (
            <Select 
              value={filterValue} 
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm bg-white">
                <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
                <SelectValue placeholder="Filtrar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    <ListFilter className="h-3.5 w-3.5" />
                    Todos
                  </div>
                </SelectItem>
                {filterOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {extraFilters && extraFilters.map((ef) => (
            <Select
              key={ef.paramName}
              value={extraValues[ef.paramName] || 'TODOS'}
              onValueChange={(val) => handleExtraFilterChange(ef.paramName, val)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm bg-white">
                <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
                <SelectValue placeholder={ef.placeholder || "Filtrar..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    <ListFilter className="h-3.5 w-3.5" />
                    {ef.placeholder || 'Todos'}
                  </div>
                </SelectItem>
                {ef.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <Button 
            onClick={handleSearch} 
            disabled={isPending}
            className="h-9 bg-[#1B4D3E] hover:bg-[#13382D] w-full sm:w-auto"
          >
            {isPending ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {showViewToggle && cardsView && (
          <div className="flex items-center border rounded-lg p-0.5 bg-gray-50/80 shadow-xs self-end sm:self-auto">
            <Button
              type="button"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={`h-8 px-2.5 text-xs font-medium gap-1.5 ${viewMode === 'table' ? 'bg-white shadow-xs text-[#1B4D3E] font-semibold' : 'text-gray-600'}`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Tabela
            </Button>
            <Button
              type="button"
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`h-8 px-2.5 text-xs font-medium gap-1.5 ${viewMode === 'cards' ? 'bg-white shadow-xs text-[#1B4D3E] font-semibold' : 'text-gray-600'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area with Instant Skeleton Feedback */}
      <div className="relative min-h-[300px]">
        {isPending ? (
          viewMode === 'cards' && cardsView ? (
            <CardGridSkeleton count={6} />
          ) : (
            <TableSkeleton rows={6} columns={7} showToolbar={false} />
          )
        ) : (
          viewMode === 'cards' && cardsView ? (
            <div className="animate-in fade-in duration-150">{cardsView}</div>
          ) : (
            <div className="animate-in fade-in duration-150">{tableView}</div>
          )
        )}
      </div>

    </div>
  )
}
