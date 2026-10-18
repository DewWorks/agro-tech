import { getUserContext } from '@/lib/auth'
import BrandingForm from './BrandingForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Palette } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function BrandingPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  if (!dbUser.organization) return null

  const isOwner = dbUser.role === 'OWNER'
  const isSuperAdmin = dbUser.realRole === 'SUPER_ADMIN'
  const canEdit = isOwner || isSuperAdmin

  return (
    <div className="grid gap-6">
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
            organization={dbUser.organization}
            canEdit={canEdit}
            isSuperAdmin={isSuperAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
