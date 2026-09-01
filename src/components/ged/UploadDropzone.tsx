'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, formatFileSize } from '@/lib/ged/utils'
import { DOCUMENT_TYPE_LABELS } from '@/lib/ged/semaphore'
import { getSignedUrlForUpload, createDocumentRecord } from '@/actions/documents'

interface UploadDropzoneProps {
  producerId: string
  branchId: string
  propertyId?: string
  onUploadComplete?: () => void
  onClose?: () => void
}

interface FileUploadState {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

export default function UploadDropzone({
  producerId,
  branchId,
  propertyId,
  onUploadComplete,
  onClose,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileUploadState | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não permitido. Aceitos: PDF, JPG, PNG, TIFF.'
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `O arquivo excede o limite de ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
    }
    return null
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }
    setSelectedFile({ file, progress: 0, status: 'pending' })
  }, [validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error('Selecione o tipo de documento.')
      return
    }

    setIsUploading(true)
    setSelectedFile(prev => prev ? { ...prev, status: 'uploading', progress: 10 } : null)

    try {
      // 1. Obter Signed URL
      const urlResult = await getSignedUrlForUpload({
        fileName: selectedFile.file.name,
        mimeType: selectedFile.file.type,
        fileSize: selectedFile.file.size,
        producerId,
        branchId,
        propertyId,
        documentType,
      })

      if (urlResult.error || !urlResult.data) {
        throw new Error(urlResult.error || 'Falha ao obter URL de upload')
      }

      setSelectedFile(prev => prev ? { ...prev, progress: 30 } : null)

      // 2. Upload direto ao Supabase Storage via PUT
      const uploadResponse = await fetch(urlResult.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.file.type },
        body: selectedFile.file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload do arquivo para o Storage')
      }

      setSelectedFile(prev => prev ? { ...prev, progress: 70 } : null)

      // 3. Criar registro no banco de dados
      const recordResult = await createDocumentRecord({
        branchId,
        producerId,
        propertyId,
        documentType,
        fileName: selectedFile.file.name,
        fileSize: selectedFile.file.size,
        mimeType: selectedFile.file.type,
        storagePath: urlResult.data.storagePath,
        issueDate: issueDate || null,
        expirationDate: expirationDate || null,
      })

      if (recordResult.error) {
        throw new Error(recordResult.error)
      }

      setSelectedFile(prev => prev ? { ...prev, progress: 100, status: 'success' } : null)
      toast.success('Documento enviado com sucesso!')

      // Reset após 1.5s
      setTimeout(() => {
        setSelectedFile(null)
        setDocumentType('')
        setIssueDate('')
        setExpirationDate('')
        onUploadComplete?.()
      }, 1500)
    } catch (error: any) {
      setSelectedFile(prev => prev
        ? { ...prev, status: 'error', errorMessage: error.message }
        : null
      )
      toast.error(error.message || 'Erro ao enviar documento.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-[#1B4D3E] bg-[#1B4D3E]/5 scale-[1.01]'
            : selectedFile
              ? 'border-gray-200 bg-white cursor-default'
              : 'border-gray-300 bg-slate-50 hover:border-[#1B4D3E]/50 hover:bg-slate-100'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
          className="hidden"
          onChange={handleInputChange}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-[#1B4D3E]" />
            </div>
            <div>
              <p className="font-medium text-gray-700">
                Arraste um arquivo aqui ou <span className="text-[#1B4D3E] underline">clique para selecionar</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG ou TIFF — Máximo {formatFileSize(MAX_FILE_SIZE_BYTES)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File Info */}
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#1B4D3E]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-[#1B4D3E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {selectedFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.file.size)}
                </p>
              </div>
              {selectedFile.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : selectedFile.status === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : (
                <button onClick={removeFile} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {(selectedFile.status === 'uploading' || selectedFile.status === 'success') && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    selectedFile.status === 'success' ? 'bg-green-500' : 'bg-[#1B4D3E]'
                  }`}
                  style={{ width: `${selectedFile.progress}%` }}
                />
              </div>
            )}

            {selectedFile.status === 'error' && (
              <p className="text-xs text-red-500">{selectedFile.errorMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Form Fields */}
      {selectedFile && selectedFile.status !== 'success' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Tipo de Documento *</Label>
            <Select value={documentType} onValueChange={(val) => setDocumentType(val || '')}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Data de Emissão</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Data de Validade</Label>
            <Input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && selectedFile.status !== 'success' && (
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="bg-[#1B4D3E] hover:bg-[#13382D]"
            onClick={handleUpload}
            disabled={isUploading || !documentType}
          >
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Enviar Documento</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
