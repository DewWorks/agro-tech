import { redirect } from 'next/navigation';
// No mundo real, importariamos o getUserContext() do lib/auth para checar roles
// Importaremos as métricas do server action
import { 
  getFranchiseUsage, 
  getEmissionsOverTime, 
  getEmissionsRanking, 
  getGlobalSemaphoreOverview 
} from '@/actions/owner-dashboard';

// Simulação de autenticação
const getCurrentUser = async () => {
  return { id: 'usr_1', role: 'OWNER', branchId: 'branch_1' };
};

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser();

  // 🔒 Guarda de Rota: Apenas OWNER pode acessar
  if (user.role !== 'OWNER') {
    redirect('/admin'); 
  }

  // Busca paralela no DB
  const [usage, timeData, ranking, semaphores] = await Promise.all([
    getFranchiseUsage(user.branchId),
    getEmissionsOverTime(user.branchId),
    getEmissionsRanking(user.branchId),
    getGlobalSemaphoreOverview(user.branchId)
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
          Dashboard Administrativo (SaaS)
        </h1>
        <div className="text-sm text-gray-500">Filial Ativa: {user.branchId}</div>
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Franquia de Emissões</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{usage.used}</span>
            <span className="text-sm text-gray-500">/ {usage.limit}</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
            <div 
              className={`h-2 rounded-full ${usage.percentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
              style={{ width: `${usage.percentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Armazenamento (S3)</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">12 GB</span>
            <span className="text-sm text-gray-500">/ 50 GB</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: '24%' }} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Documentos em Alerta (30d)</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-500">{semaphores.expiring30}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Documentos Vencidos</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-500">{semaphores.expired}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* RANKING */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Top Produtores (Volume)</h3>
          <div className="space-y-4">
            {ranking.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.producerName}</span>
                <span className="text-sm font-bold text-emerald-600">{r.emissionsCount} docs</span>
              </div>
            ))}
            {ranking.length === 0 && <p className="text-sm text-gray-500">Nenhuma emissão registrada.</p>}
          </div>
        </div>

        {/* MOCK DE GRÁFICO */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col items-center justify-center min-h-[250px]">
          <h3 className="text-lg font-bold mb-4 self-start">Volume de Emissões Diárias</h3>
          <div className="text-sm text-gray-400">
            [ Área reservada para componente Recharts <br/> renderizando a variável 'timeData' ]
          </div>
        </div>
      </div>
    </div>
  );
}
