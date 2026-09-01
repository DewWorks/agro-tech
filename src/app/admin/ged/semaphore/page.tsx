import { getUserContext } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GlobalDocumentTable } from '@/components/ged/GlobalDocumentTable'
import { calculateDocumentStatus, DocumentStatus } from '@/lib/ged/semaphore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'

export default async function GedSemaphorePage() {
  const dbUser = await getUserContext()
  if (!dbUser?.organizationId) redirect('/admin')

  // Fetch all documents for this organization
  const documents = await prisma.document.findMany({
    where: { 
      producer: { 
        branch: { organizationId: dbUser.organizationId }
      }
    },
    include: {
      producer: { select: { name: true } }
    },
    orderBy: { expirationDate: 'asc' }
  })

  // Calculate stats
  let validCount = 0
  let alertCount = 0
  let expiredCount = 0
  
  const processedDocuments = documents.map(doc => {
    const calculatedStatus = calculateDocumentStatus(doc.expirationDate, doc.documentType)
    if (calculatedStatus === 'VALIDO') validCount++
    if (calculatedStatus === 'ALERTA') alertCount++
    if (calculatedStatus === 'VENCIDO') expiredCount++
    return { 
      ...doc, 
      fileSize: Number(doc.fileSize),
      calculatedStatus 
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E]">
          Validades & Semáforo
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitorização global de todos os documentos anexados.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-red-100 bg-red-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600/80">Vencidas</p>
              <h3 className="text-3xl font-bold text-red-700">{expiredCount}</h3>
              <p className="text-xs text-red-600/60 mt-1">Bloqueiam processos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-100 bg-amber-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600/80">A Vencer</p>
              <h3 className="text-3xl font-bold text-amber-700">{alertCount}</h3>
              <p className="text-xs text-amber-600/60 mt-1">Requerem atenção</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-100 bg-green-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600/80">Válidas</p>
              <h3 className="text-3xl font-bold text-green-700">{validCount}</h3>
              <p className="text-xs text-green-600/60 mt-1">Documentos regulares</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {expiredCount > 0 && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            {expiredCount} documento{expiredCount > 1 ? 's vencidos estão' : ' vencido está'} travando a conformidade geral. Regularize o quanto antes.
          </p>
        </div>
      )}

      {/* Global Table */}
      <Card className="shadow-sm border">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle className="text-lg">Controle de Validades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <GlobalDocumentTable initialDocuments={processedDocuments} />
        </CardContent>
      </Card>
    </div>
  )
}
