import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ProfileForm from './ProfileForm'
import { getUserContext } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const dbUser = await getUserContext()

  if (!dbUser) {
    redirect('/login')
  }

  const userBranchesData = await prisma.userBranch.findMany({
    where: { userId: dbUser.id },
    include: { branch: true }
  })

  return (
    <div className="grid gap-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1B4D3E]">Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize o seu nome completo e os seus dados básicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={dbUser} email={dbUser.email || ''} />
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1B4D3E]">Acessos e Vínculos</CardTitle>
          <CardDescription>
            Informações sobre as suas permissões no sistema. (Apenas Leitura)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <span className="text-xs font-semibold text-gray-500 uppercase">Função Global</span>
              <p className="mt-1 font-medium">{dbUser.role}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <span className="text-xs font-semibold text-gray-500 uppercase">Filiais Vinculadas</span>
              <ul className="mt-1 font-medium space-y-1">
                {userBranchesData.length > 0 ? (
                  userBranchesData.map(ub => (
                    <li key={ub.branchId} className="flex justify-between items-center">
                      <span>{ub.branch.name}</span>
                      <span className="text-xs bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded-full">{ub.role}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-gray-500">Nenhuma filial vinculada</span>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
