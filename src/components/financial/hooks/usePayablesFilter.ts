'use client'

import { useState, useMemo } from 'react'

export function usePayablesFilter(payables: any[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  const filteredPayables = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return payables.filter((p) => {
      const matchesSearch =
        term === '' ||
        p.supplierName?.toLowerCase().includes(term) ||
        p.documentNumber?.toLowerCase().includes(term) ||
        p.notes?.toLowerCase().includes(term)

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
      const matchesType = typeFilter === 'ALL' || p.expenseType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [payables, searchTerm, statusFilter, typeFilter])

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    filteredPayables,
  }
}
