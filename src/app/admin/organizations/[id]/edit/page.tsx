import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OrganizationForm from '@/app/admin/settings/organization/OrganizationForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal'
import { toggleOrganizationModule } from '@/actions/modules'

import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const dbUser = await getUserContext()

  if (!dbUser || dbUser.realRole !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const organization = await prisma.organization.findUnique({
    where: { id: resolvedParams.id },
  })

  const globalModules = await prisma.systemModule.findMany({
    orderBy: { name: 'asc' }
  })

  if (!organization) {
    redirect('/admin/organizations')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizations">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E]">
            Editar Organização
          </h1>
          <p className="text-muted-foreground mt-2">
            Altere os dados da organização como Super Admin.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1B4D3E]">Dados da Empresa</CardTitle>
            <CardDescription>
              Informações sobre {organization.name}. Como Super Admin, você pode alterar todos os campos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationForm 
              organization={organization} 
              isOwner={true} 
              isSuperAdmin={true} 
            />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1B4D3E]">Módulos de Acesso</CardTitle>
            <CardDescription>
              Gerencie quais ferramentas e módulos estão disponíveis para {organization.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {globalModules.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum módulo global cadastrado.</p>
              )}
              {globalModules.map(mod => {
                const isOrgActive = (organization.modules || []).includes(mod.code)
                return (
                  <div key={mod.code} className={`flex items-center justify-between p-4 rounded-lg border ${!mod.isActive ? 'bg-red-50/30 border-red-100' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div>
                      <strong className={`text-sm font-semibold ${!mod.isActive ? 'text-red-800' : 'text-gray-800'}`}>
                        {mod.name} {!mod.isActive && '(Desativado Globalmente)'}
                      </strong>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {!mod.isActive ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                          <AlertTriangle className="h-3 w-3" />
                          Desativado Global
                        </div>
                      ) : (
                        <>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isOrgActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {isOrgActive ? 'Ativado' : 'Desativado'}
                          </span>
                          <ConfirmActionModal
                            title={isOrgActive ? `Desativar ${mod.name}?` : `Ativar ${mod.name}?`}
                            description={isOrgActive 
                              ? `Isto removerá o acesso da organização aos recursos de ${mod.name}.`
                              : `Isto ativará o acesso da organização aos recursos de ${mod.name}.`
                            }
                            triggerText=""
                            useSwitch={true}
                            isActive={isOrgActive}
                            tooltip={isOrgActive ? "Desativar Módulo" : "Ativar Módulo"}
                            action={async () => {
                              'use server'
                              return await toggleOrganizationModule(organization.id, mod.code, !isOrgActive)
                            }}
                            successMessage={`Módulo ${isOrgActive ? 'desativado' : 'ativado'} com sucesso!`}
                            actionLabel="Confirmar"
                            actionVariant={isOrgActive ? 'destructive' : 'default'}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
