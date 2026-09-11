import { compressExistingDocuments } from '@/actions/documents';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/auth';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    document: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getUserContext: jest.fn(),
}));

jest.mock('@/lib/ged/storage', () => ({
  BUCKET_NAME: 'agrotech-documents',
}));

const mockDownload = jest.fn();
const mockUpload = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn(() => ({
        download: mockDownload,
        upload: mockUpload,
      })),
    },
  },
}));

describe('Otimização e Compressão em Lote de Documentos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserContext as jest.Mock).mockResolvedValue({
      id: 'usr_1',
      role: 'SUPER_ADMIN',
      realRole: 'SUPER_ADMIN',
      organizationId: 'org_123',
    });
  });

  it('deve rejeitar execução quando usuário não for SUPER_ADMIN', async () => {
    (getUserContext as jest.Mock).mockResolvedValueOnce({
      id: 'usr_regular',
      role: 'OWNER',
      realRole: 'OWNER',
      organizationId: 'org_123',
    });

    const result = await compressExistingDocuments();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Super Administradores/i);
  });

  it('deve retornar resultado positivo e relatório quando não há documentos no escopo', async () => {
    (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

    const result = await compressExistingDocuments();

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(0);
    expect(result.optimizedCount).toBe(0);
    expect(result.totalSavedBytes).toBe(0);
  });

  it('deve processar documentos e atualizar apenas os que apresentarem redução real de tamanho', async () => {
    (prisma.document.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'doc_1',
        fileName: 'teste.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        storagePath: 'path/teste.pdf',
      },
    ]);

    // Simula download retornando buffer
    const mockArrayBuffer = new ArrayBuffer(500000);
    mockDownload.mockResolvedValue({
      data: {
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      },
      error: null,
    });

    mockUpload.mockResolvedValue({ error: null });
    (prisma.document.update as jest.Mock).mockResolvedValue({});

    const result = await compressExistingDocuments();

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.originalTotal).toBe(500000);
  });
});
