'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown, Eye, Download, Replace, MoreHorizontal, FileText, GitBranch, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DOCUMENT_TYPE_LABELS, type DocumentStatus } from '@/lib/ged/semaphore'
import { formatFileSize } from '@/lib/ged/utils'
import DocumentStatusBadge from './DocumentStatusBadge'

export interface DocumentRow {
  id: string
  fileName: string
  documentType: string
  issueDate: Date | string | null
  expirationDate: Date | string | null
  fileSize: number
  mimeType: string
  storagePath: string
  isInherited: boolean
  cropYear: string | null
  inheritedFromId: string | null
  calculatedStatus: DocumentStatus
  producer?: { id: string; name: string } | null
  property?: { id: string; name: string } | null
}

interface DocumentTableProps {
  documents: DocumentRow[]
  onView: (doc: DocumentRow) => void
  onDownload: (doc: DocumentRow) => void
  onReplace: (doc: DocumentRow) => void
  onArchive?: (doc: DocumentRow) => void
  showProducerColumn?: boolean
}

export default function DocumentTable({
  documents,
  onView,
  onDownload,
  onReplace,
  onArchive,
  showProducerColumn = false,
}: DocumentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})

  const columns: ColumnDef<DocumentRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: 'fileName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nome do Arquivo
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const doc = row.original
        return (
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-[#1B4D3E] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                {doc.fileName}
              </p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'documentType',
      header: 'Tipo',
      cell: ({ getValue }) => {
        const type = getValue<string>()
        return (
          <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
            {DOCUMENT_TYPE_LABELS[type] || type}
          </Badge>
        )
      },
    },
    ...(showProducerColumn
      ? [{
          accessorKey: 'producer',
          header: 'Produtor',
          cell: ({ row }: { row: any }) => {
            const producer = row.original.producer
            return producer ? (
              <span className="text-sm text-gray-700">{producer.name}</span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )
          },
        } as ColumnDef<DocumentRow>]
      : []
    ),
    {
      accessorKey: 'issueDate',
      header: 'Emissão',
      cell: ({ getValue }) => {
        const date = getValue<Date | string | null>()
        if (!date) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <span className="text-xs">
            {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        )
      },
    },
    {
      accessorKey: 'expirationDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Validade
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const date = getValue<Date | string | null>()
        if (!date) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <span className="text-xs">
            {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <DocumentStatusBadge
          expirationDate={row.original.expirationDate}
          documentType={row.original.documentType}
        />
      ),
    },
    {
      id: 'inheritance',
      header: '',
      cell: ({ row }) => {
        if (!row.original.isInherited) return null
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
            <GitBranch className="h-2.5 w-2.5 mr-1" />
            Herdado{row.original.cropYear ? ` · ${row.original.cropYear}` : ''}
          </Badge>
        )
      },
      size: 140,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const doc = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(doc)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(doc)} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                Baixar Arquivo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onReplace(doc)} className="cursor-pointer">
                <Replace className="mr-2 h-4 w-4" />
                Substituir Documento
              </DropdownMenuItem>
              {onArchive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onArchive(doc)} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Arquivar / Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  })

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-slate-50/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-xs">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Nenhum documento encontrado</p>
                <p className="text-xs mt-1">Selecione um produtor na árvore ou envie um novo documento.</p>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Selection Summary */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-[#1B4D3E]/5">
          <span className="text-xs text-[#1B4D3E] font-medium">
            {Object.keys(rowSelection).length} documento(s) selecionado(s)
          </span>
        </div>
      )}
    </div>
  )
}
