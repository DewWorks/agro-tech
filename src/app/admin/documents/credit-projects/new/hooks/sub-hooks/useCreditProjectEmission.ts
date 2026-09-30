import { useState } from 'react'
import { toast } from 'sonner'
import { saveCreditProjectData } from '@/actions/credit-projects'
import { CustomOptions } from '../../types/wizard-types'

export interface UseCreditProjectEmissionParams {
  selectedProducerId: string
  selectedPropertyId: string
  selectedTemplateCode: string
  customOptions: CustomOptions
}

export function useCreditProjectEmission({
  selectedProducerId,
  selectedPropertyId,
  selectedTemplateCode,
  customOptions,
}: UseCreditProjectEmissionParams) {
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false)
  const [saveModalStep, setSaveModalStep] = useState<number>(1)

  const handleOpenSaveModal = () => {
    if (!selectedProducerId || !selectedTemplateCode) {
      toast.error('Selecione um produtor e um modelo antes de salvar.')
      return
    }
    setSaveModalStep(1)
    setIsSaveDraftModalOpen(true)
  }

  const executeSaveDraft = async () => {
    if (!selectedProducerId || !selectedTemplateCode) {
      toast.error('Selecione um produtor e um modelo para salvar.')
      return
    }
    setIsSavingDraft(true)
    try {
      await saveCreditProjectData(
        selectedProducerId,
        selectedPropertyId,
        selectedTemplateCode,
        customOptions
      )
      if (typeof window !== 'undefined') {
        if (customOptions.creaNumber) localStorage.setItem('agrotech_rt_crea', customOptions.creaNumber)
        if (customOptions.artNumber) localStorage.setItem('agrotech_rt_art', customOptions.artNumber)
        if (customOptions.responsibleName) localStorage.setItem('agrotech_rt_name', customOptions.responsibleName)
      }
      setIsSaveDraftModalOpen(false)
      toast.success(
        'Informações salvas e sincronizadas com sucesso no cadastro permanente do Produtor e da Propriedade!'
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar informações do projeto.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  return {
    isSavingDraft,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isSaveDraftModalOpen,
    setIsSaveDraftModalOpen,
    saveModalStep,
    setSaveModalStep,
    handleOpenSaveModal,
    executeSaveDraft,
  }
}
