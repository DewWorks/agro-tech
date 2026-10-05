'use client'

import { useState, useMemo } from 'react'

export function useReceivablesFilter(titles: any[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filteredTitles = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return titles.filter((t) => {
      const matchesSearch =
        term === '' ||
        t.producer?.name?.toLowerCase().includes(term) ||
        t.documentNumber?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term)

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [titles, searchTerm, statusFilter])

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredTitles,
  }
}
