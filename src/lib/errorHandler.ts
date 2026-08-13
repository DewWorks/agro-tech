import { Prisma } from '@prisma/client'

/**
 * Utilitário para formatar erros brutos (especialmente do Prisma) 
 * em mensagens amigáveis para o utilizador final.
 */
export function handleServerError(error: any, customMessages?: Record<string, string>): string {
  console.error('[Server Action Error]', error)

  // Se o erro já for uma mensagem simples lançada manualmente por nós (ex: throw new Error('Meu erro'))
  if (error instanceof Error && !error.message.includes('Prisma') && !error.message.includes('invocation')) {
    return error.message
  }

  // Tratamento específico de erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return customMessages?.P2002 || 'Já existe um registo com estes dados únicos no sistema.'
      case 'P2003':
        if (error.message.includes('branchId')) {
          return 'A filial selecionada é inválida ou já não existe.'
        }
        return customMessages?.P2003 || 'Erro de integridade de dados (Referência não encontrada).'
      case 'P2025':
        return customMessages?.P2025 || 'O registo que tentou atualizar não foi encontrado.'
      default:
        return 'Ocorreu um erro na base de dados. Por favor, contacte o suporte.'
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Os dados enviados estão incompletos ou num formato inválido.'
  }

  return typeof error === 'string' ? error : 'Ocorreu um erro inesperado no servidor.'
}
