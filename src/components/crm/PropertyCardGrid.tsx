'use client'

import Link from 'next/link'
import { MapPin, FileText, ArrowRight, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export interface PropertyItem {
  id: string
  name: string
  propertyName?: string | null
  city?: string | null
  state?: string | null
  totalArea: number
  pastureArea: number
  productiveArea: number
  car?: string | null
  registrationNumber?: string | null
  explorationActivity?: string | null
  branch: {
    id: string
    name: string
  }
  producers: Array<{
    ownershipType: string
    producer: {
      id: string
      name: string
      document: string
      type: string
    }
  }>
  _count?: {
    documents: number
  }
}

interface PropertyCardGridProps {
  properties: PropertyItem[]
}

export default function PropertyCardGrid({ properties }: PropertyCardGridProps) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold text-gray-800">Nenhuma propriedade encontrada</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Não foram encontrados imóveis rurais com os filtros aplicados.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((p) => {
        const mainProducer = p.producers?.[0]?.producer
        const ownershipType = p.producers?.[0]?.ownershipType
        const locationStr = [p.city, p.state].filter(Boolean).join('/') || 'Localização não informada'
        const totalAreaStr = p.totalArea > 0 ? `${p.totalArea} ha` : (p.pastureArea > 0 ? `${p.pastureArea} ha` : 'Área não inf.')
        const docsCount = p._count?.documents || 0

        return (
          <Link 
            key={p.id} 
            href={`/admin/crm/properties/${p.id}/edit`}
            className="block group"
          >
            <Card className="h-full bg-white hover:border-[#1B4D3E] hover:shadow-md transition-all duration-200 border rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-5">
                
                {/* Top header: Location Icon + Badges */}
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#1B4D3E] group-hover:scale-110 transition-transform shadow-xs">
                    <MapPin className="h-5 w-5 text-[#1B4D3E]" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {docsCount > 0 && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs font-medium border-blue-200/60">
                        <FileText className="h-3 w-3 mr-1" />
                        {docsCount} {docsCount === 1 ? 'doc' : 'docs'}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs font-medium">
                      {p.producers?.length || 1} {p.producers?.length === 1 ? 'imóvel' : 'imóveis'}
                    </Badge>
                  </div>
                </div>

                {/* Title & Location */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1B4D3E] transition-colors line-clamp-1">
                    {p.name || p.propertyName || 'Propriedade Rural'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    {locationStr}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filial: {p.branch.name}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 text-xs font-medium">Titular</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
                      {mainProducer?.name || 'Não vinculado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 text-xs font-medium">Área mapeada</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {totalAreaStr}
                    </span>
                  </div>

                  {p.car && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
                      <span className="text-slate-400 font-mono text-[11px]">CAR</span>
                      <span className="font-mono text-[11px] truncate max-w-[200px]" title={p.car}>
                        {p.car}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Link Action */}
                <div className="flex items-center justify-between pt-2 text-xs font-semibold text-[#1B4D3E] group-hover:underline">
                  <span>Ver detalhes e documentos</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>

              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
