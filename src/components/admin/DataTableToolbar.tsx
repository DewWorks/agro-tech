'use client'

import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'

export interface FilterOption {
  label: React.ReactNode
  value: string
}

interface DataTableToolbarProps {
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  filterParamName?: string
}

export default function DataTableToolbar({ 
  searchPlaceholder = "Buscar...",
  filterOptions,
  filterParamName = "status"
}: DataTableToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const initialQuery = searchParams.get('q') || ''
  const initialFilter = searchParams.get(filterParamName) || 'TODOS'

  const [query, setQuery] = useState(initialQuery)
  const [filterValue, setFilterValue] = useState(initialFilter)

  // Atualiza os estados locais se a URL mudar externamente
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    setFilterValue(searchParams.get(filterParamName) || 'TODOS')
  }, [searchParams, filterParamName])

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }

      if (filterValue && filterValue !== 'TODOS') {
        params.set(filterParamName, filterValue)
      } else {
        params.delete(filterParamName)
      }
      
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-4">
      <div className="relative flex-1 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className="pl-9 h-9"
        />
      </div>
      
      {filterOptions && filterOptions.length > 0 && (
        <Select 
          value={filterValue} 
          onValueChange={(val) => setFilterValue(val || 'TODOS')}
        >
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <SelectValue placeholder="Filtrar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {filterOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button 
        onClick={handleSearch} 
        disabled={isPending}
        className="h-9 bg-[#1B4D3E] hover:bg-[#13382D] w-full sm:w-auto"
      >
        {isPending ? 'Buscando...' : 'Buscar'}
      </Button>
    </div>
  )
}
