'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tractor, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CRMNavigationTabsProps {
  producersCount?: number
  propertiesCount?: number
  branchName?: string
}

export default function CRMNavigationTabs({
  producersCount,
  propertiesCount,
  branchName
}: CRMNavigationTabsProps) {
  const pathname = usePathname()
  const isProperties = pathname.startsWith('/admin/crm/properties')
  const isProducers = !isProperties && pathname.startsWith('/admin/crm')

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
      <div className="flex items-center gap-2">
        <Link href="/admin/crm" prefetch={true}>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              isProducers
                ? 'bg-[#1B4D3E] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Tractor className="h-4 w-4" />
            Produtores Rurais
            {producersCount !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                  isProducers
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {producersCount}
              </span>
            )}
          </button>
        </Link>

        <Link href="/admin/crm/properties" prefetch={true}>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              isProperties
                ? 'bg-[#1B4D3E] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MapPin className="h-4 w-4" />
            Propriedades Rurais
            {propertiesCount !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                  isProperties
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {propertiesCount}
              </span>
            )}
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {isProperties ? (
          <Link href="/admin/crm/properties/new" prefetch={true}>
            <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white shadow-sm h-9">
              <Plus className="mr-2 h-4 w-4" /> Nova Propriedade
            </Button>
          </Link>
        ) : (
          <Link href="/admin/crm/new" prefetch={true}>
            <Button className="bg-[#1B4D3E] hover:bg-[#13382D] text-white shadow-sm h-9">
              <Plus className="mr-2 h-4 w-4" /> Novo Produtor
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
