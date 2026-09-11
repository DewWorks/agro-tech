import {
  getFranchiseUsage,
  getEmissionsOverTime,
  getEmissionsRankingByTemplate,
  getRealStorageMetrics,
} from '@/actions/owner-dashboard';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    generatedForm: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    document: {
      aggregate: jest.fn(),
    },
    branch: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}));

describe('Owner Dashboard — Métricas de Franquia, Emissões e Armazenamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserContext as jest.Mock).mockResolvedValue({
      id: 'usr_owner_1',
      role: 'OWNER',
      organizationId: 'org_test_123',
      organization: { name: 'Agropecuária Sul' },
    });
  });

  describe('Franquia de Emissões (300 cotas)', () => {
    it('deve calcular corretamente a cota consumida e o percentual no limite de 300', async () => {
      // 150 emissões no mês atual, 450 no histórico
      (prisma.generatedForm.count as jest.Mock)
        .mockResolvedValueOnce(150) // mês atual
        .mockResolvedValueOnce(450); // total all-time

      const result = await getFranchiseUsage();

      expect(result.used).toBe(150);
      expect(result.limit).toBe(300);
      expect(result.percentage).toBe(50);
      expect(result.totalAllTime).toBe(450);
    });

    it('deve limitar o percentual a no máximo 100% se ultrapassar o limite contratado', async () => {
      (prisma.generatedForm.count as jest.Mock)
        .mockResolvedValueOnce(350)
        .mockResolvedValueOnce(800);

      const result = await getFranchiseUsage();

      expect(result.used).toBe(350);
      expect(result.percentage).toBe(100);
    });
  });

  describe('Volume de Emissões Diárias (Recharts 30 dias)', () => {
    it('deve retornar exatamente 30 pontos contínuos no tempo com contagem zerada para dias sem emissão', async () => {
      (prisma.generatedForm.findMany as jest.Mock).mockResolvedValue([
        { createdAt: new Date() },
      ]);

      const timePoints = await getEmissionsOverTime();

      expect(timePoints).toHaveLength(30);
      expect(timePoints[29].count).toBeGreaterThanOrEqual(1);
      expect(timePoints[0]).toHaveProperty('date');
      expect(timePoints[0]).toHaveProperty('formattedDate');
      expect(timePoints[0]).toHaveProperty('count');
    });
  });

  describe('Ranking de Documentos Mais Emitidos', () => {
    it('deve retornar metadados amigáveis de templates e calcular percentuais', async () => {
      (prisma.generatedForm.groupBy as jest.Mock).mockResolvedValue([
        { templateCode: 'CHECKLIST_PROFISSIONAL', _count: { id: 60 } },
        { templateCode: 'LIMITE_CREDITO_BB', _count: { id: 40 } },
      ]);

      const rankings = await getEmissionsRankingByTemplate();

      expect(rankings).toHaveLength(2);
      expect(rankings[0].title).toBe('Checklist Profissional de Atendimento');
      expect(rankings[0].count).toBe(60);
      expect(rankings[0].percentage).toBe(60);

      expect(rankings[1].title).toBe('Ficha Cadastral e Levantamento Patrimonial');
      expect(rankings[1].count).toBe(40);
      expect(rankings[1].percentage).toBe(40);
    });
  });

  describe('Armazenamento Real (S3 / Supabase)', () => {
    it('deve calcular o total de bytes e formatar adequadamente em MB/GB', async () => {
      (prisma.document.aggregate as jest.Mock).mockResolvedValue({
        _sum: { fileSize: 10485760 }, // 10 MB
        _count: { id: 25 },
      });

      const metrics = await getRealStorageMetrics();

      expect(metrics.totalBytes).toBe(10485760);
      expect(metrics.formattedUsed).toBe('10.0 MB');
      expect(metrics.totalDocuments).toBe(25);
      expect(metrics.formattedLimit).toBe('50 GB');
      expect(metrics.percentage).toBeGreaterThan(0);
    });
  });
});
