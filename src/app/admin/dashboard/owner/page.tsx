import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth';
import { getAllOwnerDashboardData } from '@/actions/owner-dashboard';
import EmissionsChart from './components/EmissionsChart';
import BranchFilterSelect from './components/BranchFilterSelect';
import OptimizeExistingDocsButton from './components/OptimizeExistingDocsButton';
import RankingsSection from './components/RankingsSection';
import RecentEmissionsTable from './components/RecentEmissionsTable';
import { GlobalDocumentTable } from '@/components/ged/GlobalDocumentTable';
import {
  FileCheck2,
  HardDrive,
  AlertTriangle,
  ClockAlert,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { PageHeaderBanner } from '@/components/admin/PageHeaderBanner';

interface OwnerDashboardPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export default async function OwnerDashboardPage({ searchParams }: OwnerDashboardPageProps) {
  const user = await getUserContext();

  // Guarda de Rota: Apenas OWNER e SUPER_ADMIN possuem visão executiva
  if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
    redirect('/admin');
  }

  const { branchId } = await searchParams;

  // Busca todos os dados reais em paralelo
  const {
    branches,
    usage,
    timeData,
    templatesRanking,
    producersRanking,
    propertiesRanking,
    recentEmissions,
    storage,
    semaphores,
    semaphoreData,
    effectiveOrgName,
  } = await getAllOwnerDashboardData(branchId);

  // Nome da filial ativa exibida no topo
  const activeBranchName = branchId && branchId !== 'ALL'
    ? branches.find((b) => b.id === branchId)?.name || 'Filial Selecionada'
    : 'Todas as Filiais (Consolidado)';

  // Apenas SUPER_ADMIN pode ver e acionar a otimização de documentos existentes
  const isSuperAdmin = user.role === 'SUPER_ADMIN' || (user as any).realRole === 'SUPER_ADMIN';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* CABEÇALHO DO DASHBOARD PADRONIZADO */}
      <PageHeaderBanner
        badge={effectiveOrgName || user.organization?.name || 'Organização AgroTech'}
        badgeIcon={<Building2 className="h-4 w-4 shrink-0 text-emerald-300" />}
        title="Dashboard Executivo"
        description={`Visão consolidada de franquia, cotas de emissão e performance documental • ${activeBranchName}`}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <BranchFilterSelect branches={branches} currentBranchId={branchId} />
            {isSuperAdmin && (
              <OptimizeExistingDocsButton currentBranchId={branchId} />
            )}
          </div>
        }
      />

      {/* 4 CARDS DE MÉTRICAS PRINCIPAIS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Franquia de Emissões Mensal */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Franquia Mensal
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{usage.used}</span>
              <span className="text-sm font-medium text-gray-400">/ {usage.limit} docs</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usage.percentage >= 90
                    ? 'bg-rose-500'
                    : usage.percentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.max(usage.percentage, 2)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Uso da cota: <strong>{usage.percentage}%</strong></span>
            <span className="font-medium text-emerald-700">
              Total Histórico: <strong>{usage.totalAllTime}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Armazenamento S3 Real */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Armazenamento GED
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{storage.formattedUsed}</span>
              <span className="text-sm font-medium text-gray-400">/ {storage.formattedLimit}</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.max(storage.percentage, 1)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Consumido: <strong>{storage.percentage}%</strong></span>
            <span className="font-medium text-blue-700">
              <strong>{storage.totalDocuments}</strong> arquivos
            </span>
          </div>
        </div>

        {/* Card 3: Documentos Próximos do Vencimento */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                A Vencer (Atenção)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <ClockAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">{semaphoreData?.alertCount ?? semaphores.expiring30}</span>
              <span className="text-xs font-medium text-gray-400">documentos</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Licenças e certidões que expirarão nos próximos 30 dias.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Críticos (&lt;7 dias):</span>
            <span className="font-bold text-rose-600">{semaphores.expiring7} docs</span>
          </div>
        </div>

        {/* Card 4: Documentos Já Vencidos */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Documentos Vencidos
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600">{semaphoreData?.expiredCount ?? semaphores.expired}</span>
              <span className="text-xs font-medium text-gray-400">irregulares</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Documentos que já ultrapassaram o prazo de validade legal.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Documentos em dia:</span>
            <span className="font-semibold text-emerald-700">
              {semaphoreData?.validCount ?? 0} válidos
            </span>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE EMISSÕES DIÁRIAS */}
      <EmissionsChart data={timeData} />

      {/* RANKINGS DETALHADOS (MAIS EMITIDOS, PRODUTORES, PROPRIEDADES) */}
      <RankingsSection
        templates={templatesRanking}
        producers={producersRanking}
        properties={propertiesRanking}
      />

      {/* CONTROLE DE VALIDADES & SEMÁFORO GLOBAL DE DOCUMENTOS */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Controle de Validades & Semáforo
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {semaphoreData?.validCount ?? 0} Válidos
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {semaphoreData?.alertCount ?? 0} A Vencer
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {semaphoreData?.expiredCount ?? 0} Vencidos
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Monitoramento global de conformidade documental, certidões e prazos de todos os produtores vinculados
            </p>
          </div>
        </div>

        <div className="p-0">
          <GlobalDocumentTable initialDocuments={semaphoreData?.documents ?? []} />
        </div>
      </div>

      {/* HISTÓRICO RECENTE DE EMISSÕES */}
      <RecentEmissionsTable emissions={recentEmissions} />
    </div>
  );
}
