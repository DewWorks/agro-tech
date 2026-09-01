'use client'

import { useState, useEffect } from 'react'
import { DeclarationSidebar } from '@/components/declarations/DeclarationSidebar'
import { DocumentPaperPreview } from '@/components/declarations/DocumentPaperPreview'
import { VariablePills } from '@/components/declarations/VariablePills'
import { MissingFieldsForm } from '@/components/declarations/MissingFieldsForm'
import { resolveDocumentData, saveMissingDataAndRegenerate, saveGeneratedPdfMetadata } from '@/actions/legal-documents'
import { toast } from 'sonner'

interface DeclarationsClientProps {
  producers: any[]
  templates: any[]
}

export function DeclarationsClient({ producers, templates }: DeclarationsClientProps) {
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | null>(null)
  
  const [templateData, setTemplateData] = useState<any>(null)
  const [resolvedVariables, setResolvedVariables] = useState<Record<string, any>>({})
  const [missingFields, setMissingFields] = useState<any[]>([])
  
  const [currentStep, setCurrentStep] = useState<'FORM' | 'PREVIEW'>('PREVIEW')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (selectedProducerId && selectedTemplateCode) {
      loadDocumentData()
    } else {
      setTemplateData(null)
      setResolvedVariables({})
      setMissingFields([])
    }
  }, [selectedProducerId, selectedPropertyId, selectedTemplateCode])

  const loadDocumentData = async () => {
    setIsLoading(true)
    try {
      const data = await resolveDocumentData(selectedProducerId!, selectedPropertyId, selectedTemplateCode!)
      setTemplateData(data.template)
      setResolvedVariables(data.resolvedVariables)
      
      if (data.missingFields.length > 0) {
        setMissingFields(data.missingFields)
        setCurrentStep('FORM')
      } else {
        setMissingFields([])
        setCurrentStep('PREVIEW')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar dados da minuta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMissingData = async (values: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      const payload = {
        schemaFields: Object.fromEntries(missingFields.map(f => [f.key, f])),
        values
      }
      const data = await saveMissingDataAndRegenerate(selectedProducerId!, selectedPropertyId, selectedTemplateCode!, payload)
      
      if (data.newPropertyId && data.newPropertyId !== selectedPropertyId) {
        setSelectedPropertyId(data.newPropertyId)
      }

      setTemplateData(data.template)
      setResolvedVariables(data.resolvedVariables)
      toast.success('Informações salvas com sucesso!')
      
      // Se ainda houver campos faltantes (ex: o usuário deixou em branco), abrimos de novo
      if (data.missingFields.length > 0) {
        setMissingFields(data.missingFields)
        setCurrentStep('FORM')
      } else {
        setMissingFields([])
        setCurrentStep('PREVIEW')
      }

    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar informações')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePdfMetadata = async (storagePath: string) => {
    try {
      await saveGeneratedPdfMetadata({
        producerId: selectedProducerId!,
        propertyId: selectedPropertyId,
        templateCode: selectedTemplateCode!,
        templateVersion: templateData.version,
        payloadSnapshot: resolvedVariables,
        storagePdfPath: storagePath
      })
      toast.success('Emissão registrada com sucesso!')
    } catch (error) {
      toast.error('Erro ao registrar emissão, mas o PDF foi gerado.')
    }
  }

  return (
    <div className="flex gap-8 items-start">
      <DeclarationSidebar 
        producers={producers}
        templates={templates}
        selectedProducerId={selectedProducerId}
        selectedPropertyId={selectedPropertyId}
        selectedTemplateCode={selectedTemplateCode}
        onSelectProducer={(id) => {
          setSelectedProducerId(id)
          const p = producers.find(x => x.id === id)
          if (p && p.properties.length > 0) {
            setSelectedPropertyId(p.properties[0].property.id)
          } else {
            setSelectedPropertyId(null)
          }
        }}
        onSelectProperty={setSelectedPropertyId}
        onSelectTemplate={setSelectedTemplateCode}
      />

      <div className="flex-1 max-w-4xl">
        {isLoading && (
          <div className="text-center py-12 text-slate-500">Resolvendo variáveis...</div>
        )}
        
        {!isLoading && templateData && currentStep === 'FORM' && (
          <MissingFieldsForm 
            missingFields={missingFields}
            onSave={handleSaveMissingData}
            isSubmitting={isSubmitting}
          />
        )}

        {!isLoading && templateData && currentStep === 'PREVIEW' && (
          <>
            <VariablePills resolvedVariables={resolvedVariables} />
            <DocumentPaperPreview 
              template={templateData}
              resolvedVariables={resolvedVariables}
              onSavePdfMetadata={handleSavePdfMetadata}
            />
          </>
        )}
        
        {!isLoading && !templateData && (
          <div className="flex items-center justify-center h-64 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
            Selecione um cliente e uma minuta para visualizar o documento.
          </div>
        )}
      </div>
    </div>
  )
}
