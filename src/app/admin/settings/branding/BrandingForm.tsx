'use client'

import React, { useState, useRef } from 'react'
import { updateOrganizationBranding } from '@/actions/branding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Check,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BrandingLivePreview } from './components/BrandingLivePreview'
import { brandingUpdateSchema } from '@/lib/validations/branding'

interface BrandingFormProps {
  organization: {
    id: string
    name: string
    tradeName?: string | null
    cnpj: string
    logoHorizontalUrl?: string | null
    logoDarkUrl?: string | null
    logoIconUrl?: string | null
    primaryColorHex?: string | null
    accentColorHex?: string | null
  }
  canEdit: boolean
  isSuperAdmin?: boolean
}

const COLOR_PRESETS = [
  { name: 'Spanish Green (LN)', hex: '#05964F' },
  { name: 'Verde Corporativo', hex: '#1B4D3E' },
  { name: 'Leticia Flag Orange (LN)', hex: '#FFAC00' },
  { name: 'Cinza Petróleo (LN)', hex: '#5F6873' },
  { name: 'Floresta Profunda', hex: '#113025' },
]

export default function BrandingForm({
  organization,
  canEdit,
  isSuperAdmin = false,
}: BrandingFormProps) {
  const [isPending, setIsPending] = useState(false)

  // Campos textuais
  const [name, setName] = useState(organization.name || '')
  const [tradeName, setTradeName] = useState(organization.tradeName || '')
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColorHex || '#05964F')
  const [accentColor, setAccentColor] = useState(organization.accentColorHex || '#FFAC00')

  // Estados de Imagens: [arquivo local selecionado, URL atual, flag para remover]
  const [logoHorizontalFile, setLogoHorizontalFile] = useState<File | null>(null)
  const [logoHorizontalPreview, setLogoHorizontalPreview] = useState<string | null>(
    organization.logoHorizontalUrl || null
  )
  const [removeLogoHorizontal, setRemoveLogoHorizontal] = useState(false)

  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null)
  const [logoDarkPreview, setLogoDarkPreview] = useState<string | null>(
    organization.logoDarkUrl || null
  )
  const [removeLogoDark, setRemoveLogoDark] = useState(false)

  const [logoIconFile, setLogoIconFile] = useState<File | null>(null)
  const [logoIconPreview, setLogoIconPreview] = useState<string | null>(
    organization.logoIconUrl || null
  )
  const [removeLogoIcon, setRemoveLogoIcon] = useState(false)

  const refHorizontal = useRef<HTMLInputElement>(null)
  const refDark = useRef<HTMLInputElement>(null)
  const refIcon = useRef<HTMLInputElement>(null)

  // Função defensiva para criação segura de URLs de pré-visualização
  function getSafePreviewUrl(fileOrUrl: unknown): string | null {
    if (!fileOrUrl) return null
    if (typeof fileOrUrl === 'string') return fileOrUrl
    if (typeof window !== 'undefined' && (fileOrUrl instanceof Blob || fileOrUrl instanceof File)) {
      try {
        return URL.createObjectURL(fileOrUrl)
      } catch (e) {
        console.error('Falha ao criar ObjectURL:', e)
        return null
      }
    }
    return null
  }

  // Revogação segura de ObjectURLs no desmonte ou alteração de estado para evitar vazamentos e crashes
  React.useEffect(() => {
    return () => {
      if (logoHorizontalPreview && logoHorizontalPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(logoHorizontalPreview)
        } catch {}
      }
      if (logoDarkPreview && logoDarkPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(logoDarkPreview)
        } catch {}
      }
      if (logoIconPreview && logoIconPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(logoIconPreview)
        } catch {}
      }
    }
  }, [logoHorizontalPreview, logoDarkPreview, logoIconPreview])

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void,
    setRemove: (b: boolean) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato inválido. Aceitos: PNG, JPG, WebP ou SVG.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('A imagem não pode ultrapassar 4MB.')
      return
    }

    const safeUrl = getSafePreviewUrl(file)
    if (safeUrl) {
      setFile(file)
      setPreview(safeUrl)
      setRemove(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit) return

    setIsPending(true)
    try {
      const formData = new FormData()
      formData.append('orgId', organization.id)
      formData.append('name', name.trim() || organization.name)
      formData.append('tradeName', tradeName.trim())
      formData.append('cnpj', organization.cnpj)
      formData.append('primaryColorHex', primaryColor)
      formData.append('accentColorHex', accentColor)

      if (removeLogoHorizontal) {
        formData.append('removeLogoHorizontal', 'true')
      } else if (logoHorizontalFile) {
        formData.append('logoHorizontal', logoHorizontalFile)
      }

      if (removeLogoDark) {
        formData.append('removeLogoDark', 'true')
      } else if (logoDarkFile) {
        formData.append('logoDark', logoDarkFile)
      }

      if (removeLogoIcon) {
        formData.append('removeLogoIcon', 'true')
      } else if (logoIconFile) {
        formData.append('logoIcon', logoIconFile)
      }

      const result = await updateOrganizationBranding(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Identidade visual e parâmetros salvos com sucesso!')
        setLogoHorizontalFile(null)
        setLogoDarkFile(null)
        setLogoIconFile(null)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar alterações.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="orgId" value={organization.id} />
      <input type="hidden" name="cnpj" value={organization.cnpj} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* =================================================================== */}
        {/* COLUNA ESQUERDA: FORMULÁRIO (w-full lg:w-7/12)                      */}
        {/* =================================================================== */}
        <div className="w-full lg:w-7/12 space-y-6">
          {/* =================================================================== */}
          {/* 1. SEÇÃO DE LOGOMARCAS & ATIVOS VISUAIS                           */}
          {/* =================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Logo Horizontal (Padrão para Documentos e Cabeçalho) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Logo Principal para Documentos (Horizontal)
              </Label>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                Proporção ~4:1
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Utilizada nos cabeçalhos oficiais de <strong>Dossiês de Crédito</strong> e <strong>Projetos Técnicos</strong>. Fundo transparente em PNG ou SVG recomendado.
            </p>
          </div>

          {/* Área de Visualização com Bounding Box Fiel */}
          <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-slate-50/70 min-h-[110px] flex items-center justify-center overflow-hidden">
            {logoHorizontalPreview && !removeLogoHorizontal ? (
              <div className="flex flex-col items-center gap-2 max-w-full">
                <div className="w-[190px] h-[52px] bg-white border border-gray-200 rounded-lg p-1.5 shadow-2xs flex items-center justify-center overflow-hidden">
                  <img
                    src={logoHorizontalPreview}
                    alt="Logo Horizontal Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-gray-400">Pré-visualização fiel na escala do documento</span>
              </div>
            ) : (
              <div className="text-center space-y-1 text-gray-400">
                <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">Nenhuma logo horizontal enviada</p>
                <p className="text-[10px] text-gray-400">O sistema exibirá o nome institucional como texto</p>
              </div>
            )}
          </div>

          {/* Ações de Upload / Remoção */}
          {canEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={refHorizontal}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, setLogoHorizontalFile, setLogoHorizontalPreview, setRemoveLogoHorizontal)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refHorizontal.current?.click()}
                className="text-xs flex items-center gap-1.5 font-medium flex-1 h-9"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoHorizontalPreview && !removeLogoHorizontal ? 'Substituir Imagem' : 'Enviar Logo Horizontal'}
              </Button>
              {logoHorizontalPreview && !removeLogoHorizontal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoHorizontalFile(null)
                    setRemoveLogoHorizontal(true)
                  }}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3"
                  title="Remover logotipo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Logo para Fundo Escuro / Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Logo para Fundo Escuro (Sidebar)
              </Label>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                Versão Clara
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Versão monocromática branca ou clara para perfeita legibilidade na barra lateral escura (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">#1B4D3E</code>).
            </p>
          </div>

          {/* Área de Visualização com Fundo Escuro Real da Sidebar */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 bg-[#1B4D3E] min-h-[110px] flex items-center justify-center overflow-hidden">
            {logoDarkPreview && !removeLogoDark ? (
              <div className="flex flex-col items-center gap-2 max-w-full">
                <div className="w-[190px] h-[52px] flex items-center justify-center overflow-hidden">
                  <img
                    src={logoDarkPreview}
                    alt="Logo Dark Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-white/60">Contraste sobre a cor da barra lateral</span>
              </div>
            ) : (
              <div className="text-center space-y-1 text-white/50">
                <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">Nenhuma logo clara cadastrada</p>
                <p className="text-[10px] text-white/40">Usará o padrão tipográfico AgroTech</p>
              </div>
            )}
          </div>

          {/* Ações de Upload / Remoção */}
          {canEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={refDark}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, setLogoDarkFile, setLogoDarkPreview, setRemoveLogoDark)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refDark.current?.click()}
                className="text-xs flex items-center gap-1.5 font-medium flex-1 h-9"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoDarkPreview && !removeLogoDark ? 'Substituir Imagem' : 'Enviar Logo Clara'}
              </Button>
              {logoDarkPreview && !removeLogoDark && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoDarkFile(null)
                    setRemoveLogoDark(true)
                  }}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3"
                  title="Remover logotipo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Card 3: Símbolo / Ícone (1:1) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Símbolo / Ícone Quadrado
              </Label>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                Proporção 1:1
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Ícone compacto para avatar da empresa, carimbos e exibição com a barra lateral recolhida.
            </p>
          </div>

          <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 bg-slate-50/70 min-h-[110px] flex items-center justify-center overflow-hidden">
            {logoIconPreview && !removeLogoIcon ? (
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl p-1 shadow-2xs flex items-center justify-center overflow-hidden">
                <img
                  src={logoIconPreview}
                  alt="Icon Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="text-center space-y-1 text-gray-400">
                <ImageIcon className="w-7 h-7 mx-auto stroke-1" />
                <p className="text-xs">Nenhum ícone quadrado</p>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={refIcon}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, setLogoIconFile, setLogoIconPreview, setRemoveLogoIcon)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refIcon.current?.click()}
                className="text-xs flex items-center gap-1.5 font-medium flex-1 h-9"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoIconPreview && !removeLogoIcon ? 'Substituir Ícone' : 'Enviar Símbolo (1:1)'}
              </Button>
              {logoIconPreview && !removeLogoIcon && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoIconFile(null)
                    setRemoveLogoIcon(true)
                  }}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3"
                  title="Remover símbolo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Card 4: Paleta Cromática e Presets */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Cores Institucionais
            </Label>
            <p className="text-xs text-gray-500 leading-relaxed">
              Selecione as cores da sua empresa ou utilize os presets oficiais da LN Consultoria.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="primaryColor" className="text-xs font-semibold text-gray-700">
                  Cor Primária
                </Label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1.5 bg-white">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={!canEdit}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono font-bold text-gray-700">{primaryColor.toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accentColor" className="text-xs font-semibold text-gray-700">
                  Cor de Destaque
                </Label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1.5 bg-white">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    disabled={!canEdit}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono font-bold text-gray-700">{accentColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Presets Oficiais LN Consultoria:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => canEdit && setPrimaryColor(preset.hex)}
                    disabled={!canEdit}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-gray-700 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. DADOS CORPORATIVOS INSTITUCIONAIS                              */}
      {/* =================================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          Dados Cadastrais da Empresa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="tradeName" className="text-xs font-semibold text-gray-700">
              Nome Fantasia (Interface & Header)
            </Label>
            <Input
              id="tradeName"
              name="tradeName"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Ex: LN Consultoria e Projetos"
              readOnly={!canEdit}
              className={cn(
                'rounded-xl h-10 text-sm font-medium',
                !canEdit && 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
              )}
            />
            <p className="text-[11px] text-gray-400">Nome prioritário na exibição do sistema</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
              Razão Social Oficial (Contratos e PDFs)
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lindomar Pereira Cardoso EIRELI"
              readOnly={!canEdit}
              className={cn(
                'rounded-xl h-10 text-sm font-medium',
                !canEdit && 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
              )}
            />
            <p className="text-[11px] text-gray-400">Utilizado no rodapé pericial e assinaturas</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cnpj" className="text-xs font-semibold text-gray-700">
              CNPJ
            </Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={organization.cnpj}
              readOnly
              className="rounded-xl h-10 text-sm font-medium bg-slate-100 text-slate-500 cursor-not-allowed select-none"
            />
            <p className="text-[11px] text-gray-400">Cadastrado no registro inicial da organização</p>
          </div>
        </div>
      </div>

          {/* =================================================================== */}
          {/* 3. BOTÃO DE AÇÃO                                                   */}
          {/* =================================================================== */}
          {canEdit && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-6 h-11 rounded-xl font-bold shadow-sm transition-all cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    A Guardar Alterações...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Guardar Identidade Visual
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* COLUNA DIREITA: LIVE PREVIEW & DIAGNÓSTICO (w-full lg:w-5/12)       */}
        {/* =================================================================== */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-6 space-y-4">
          <BrandingLivePreview
            name={name}
            tradeName={tradeName}
            primaryColor={primaryColor}
            accentColor={accentColor}
            logoHorizontalUrl={removeLogoHorizontal ? null : logoHorizontalPreview}
            logoDarkUrl={removeLogoDark ? null : logoDarkPreview}
            logoIconUrl={removeLogoIcon ? null : logoIconPreview}
            logoHorizontalFile={logoHorizontalFile}
            logoDarkFile={logoDarkFile}
          />
        </div>
      </div>
    </form>
  )
}
