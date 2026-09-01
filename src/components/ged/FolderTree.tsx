'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, User, MapPin, FolderOpen, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface TreeProducer {
  id: string
  name: string
  document: string
  type: string
  branchId: string
  branchName: string
  totalDocuments: number
  hasAlert: boolean
  personalDocuments: {
    count: number
    hasAlert: boolean
  }
  properties: {
    id: string
    name: string
    documentCount: number
    hasAlert: boolean
  }[]
}

interface FolderTreeProps {
  producers: TreeProducer[]
  selectedProducerId?: string | null
  selectedPropertyId?: string | null
  selectedSection?: string | null // 'pessoal' | propertyId
  onSelectProducer: (producerId: string) => void
  onSelectSection: (producerId: string, section: string | null) => void
}

export default function FolderTree({
  producers,
  selectedProducerId,
  selectedPropertyId,
  selectedSection,
  onSelectProducer,
  onSelectSection,
}: FolderTreeProps) {
  const [expandedProducers, setExpandedProducers] = useState<Set<string>>(
    new Set(selectedProducerId ? [selectedProducerId] : [])
  )

  const toggleProducer = (id: string) => {
    setExpandedProducers(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleProducerClick = (producer: TreeProducer) => {
    toggleProducer(producer.id)
    onSelectProducer(producer.id)
    onSelectSection(producer.id, null) // Seleciona todos os documentos do produtor
  }

  const handleSectionClick = (producerId: string, section: string) => {
    onSelectProducer(producerId)
    onSelectSection(producerId, section)
  }

  if (producers.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Nenhum produtor encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="px-3 py-2 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Produtores
        </h3>
      </div>

      {producers.map((producer) => {
        const isExpanded = expandedProducers.has(producer.id)
        const isSelected = selectedProducerId === producer.id && !selectedSection

        return (
          <div key={producer.id}>
            {/* Producer Node */}
            <button
              onClick={() => handleProducerClick(producer)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors group',
                isSelected
                  ? 'bg-[#1B4D3E]/10 text-[#1B4D3E] font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {isExpanded ? (
                <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />
              ) : (
                <ChevronRight size={14} className="flex-shrink-0 text-gray-400" />
              )}
              <User size={14} className={cn('flex-shrink-0', isSelected ? 'text-[#1B4D3E]' : 'text-gray-500')} />
              <span className="truncate flex-1">{producer.name}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {producer.hasAlert && (
                  <AlertTriangle size={12} className="text-amber-500" />
                )}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono">
                  {producer.totalDocuments}
                </Badge>
              </div>
            </button>

            {/* Children */}
            {isExpanded && (
              <div className="ml-5 pl-3 border-l border-gray-200 space-y-0.5 mt-0.5 mb-1">
                {/* Personal Documents */}
                <button
                  onClick={() => handleSectionClick(producer.id, 'pessoal')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded-md transition-colors',
                    selectedProducerId === producer.id && selectedSection === 'pessoal'
                      ? 'bg-[#1B4D3E]/10 text-[#1B4D3E] font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <FolderOpen size={12} className="flex-shrink-0" />
                  <span className="flex-1">Documentos Pessoais</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {producer.personalDocuments.hasAlert && (
                      <AlertTriangle size={10} className="text-amber-500" />
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {producer.personalDocuments.count}
                    </span>
                  </div>
                </button>

                {/* Properties */}
                {producer.properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => handleSectionClick(producer.id, property.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded-md transition-colors',
                      selectedProducerId === producer.id && selectedSection === property.id
                        ? 'bg-[#1B4D3E]/10 text-[#1B4D3E] font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <MapPin size={12} className="flex-shrink-0" />
                    <span className="truncate flex-1">{property.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {property.hasAlert && (
                        <AlertTriangle size={10} className="text-amber-500" />
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {property.documentCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
