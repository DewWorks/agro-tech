import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import BrandingForm from './BrandingForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Palette } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function BrandingPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  // Recuperação resiliente da organização (suporta impersonation e SUPER_ADMIN)
  let organization = dbUser.organization
  if (!organization) {
    if (dbUser.organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: dbUser.organizationId },
      })
    } else if (dbUser.role === 'SUPER_ADMIN' || dbUser.realRole === 'SUPER_ADMIN') {
      organization = await prisma.organization.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      })
    }
  }

  if (!organization) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
        <p className="text-sm font-semibold text-slate-700">Organização não identificada na sessão atual.</p>
        <p className="text-xs text-slate-500 mt-1">Por favor, selecione uma filial ativa ou recarregue a página.</p>
      </div>
    )
  }

  const isOwner = dbUser.role === 'OWNER'
  const isSuperAdmin = dbUser.realRole === 'SUPER_ADMIN'
  const canEdit = isOwner || isSuperAdmin

  return (
    <div className="w-full">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#1B4D3E]" />
            <CardTitle className="text-xl text-[#1B4D3E]">Identidade Visual & Documentos</CardTitle>
          </div>
          <CardDescription>
            Personalize a logomarca, cores institucionais e dados da sua empresa para propagação na interface e cabeçalhos oficiais de PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canEdit && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Permissão de Apenas Leitura</h4>
                <p className="text-sm">
                  Apenas usuários com a função de <strong className="font-bold">OWNER</strong> ou administradores autorizados podem atualizar as logomarcas e cores institucionais da empresa.
                </p>
              </div>
            </div>
          )}

          <BrandingForm
            organization={organization}
            canEdit={canEdit}
            isSuperAdmin={isSuperAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
