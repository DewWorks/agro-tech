import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import OrganizationForm from './OrganizationForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function OrganizationPage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  if (!dbUser.organization) return null

  const isOwner = dbUser.role === 'OWNER'

  return (
    <div className="grid gap-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1B4D3E]">Dados da Empresa</CardTitle>
          <CardDescription>
            Informações sobre a organização principal vinculada à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOwner && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Permissão Negada</h4>
                <p className="text-sm">
                  Apenas utilizadores com a função de <strong className="font-bold">OWNER</strong> podem editar os dados da organização. Os campos abaixo são apenas de leitura.
                </p>
              </div>
            </div>
          )}
          
          <OrganizationForm 
            organization={dbUser.organization} 
            isOwner={isOwner} 
            isSuperAdmin={dbUser.realRole === 'SUPER_ADMIN'} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
