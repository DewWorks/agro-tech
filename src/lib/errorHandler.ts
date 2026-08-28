import { Prisma } from '@prisma/client'
import { serverLog } from './logger'

/**
 * Utilitário para formatar erros brutos (Prisma, Supabase, genéricos)
 * em mensagens amigáveis para o utilizador final, registando-os internamente de forma segura.
 */
export function handleServerError(error: any, context?: string, customMessages?: Record<string, string>): string {
  // 1. Registar no log do sistema (Seguro, não visível na UI)
  serverLog('error', context || 'ServerAction', error)

  // 2. Erros de Autorização do Supabase ou personalizados
  if (error instanceof Error && !error.message.includes('Prisma') && !error.message.includes('invocation')) {
    // Erros conhecidos do Supabase Auth API
    if (error.message.includes('AuthApiError')) {
      return 'Ocorreu um erro no serviço de autenticação.'
    }
    if (error.message.includes('weak_password')) {
      return 'A password fornecida é demasiado fraca. Use pelo menos 6 caracteres.'
    }
    if (error.message.includes('User already registered')) {
      return 'Já existe um utilizador registado com este e-mail no serviço de autenticação.'
    }
    if (error.message.includes('Invalid login credentials')) {
      return 'As credenciais fornecidas estão incorretas.'
    }
    
    // Retornamos erros manuais seguros (lançados por nós)
    return error.message
  }

  // 3. Tratamento específico de erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return customMessages?.P2002 || 'Já existe um registo com estes dados únicos no sistema.'
      case 'P2003':
        return customMessages?.P2003 || 'Não foi possível concluir a ação devido a um erro de referência. O item pode já ter sido apagado.'
      case 'P2014':
        return customMessages?.P2014 || 'Ação inválida: este registo viola as regras da base de dados.'
      case 'P2025':
        return customMessages?.P2025 || 'O registo solicitado não foi encontrado no sistema.'
      default:
        return 'Ocorreu um erro ao interagir com a base de dados. Por favor, tente novamente mais tarde.'
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Os dados enviados estão num formato inválido ou estão incompletos.'
  }

  // 4. Erros não reconhecidos / Exceções graves
  // Se for uma string pura lançada, retorna, caso contrário mensagem genérica amigável
  return typeof error === 'string' ? error : 'Ocorreu um erro inesperado. Por favor, contacte o suporte técnico se o problema persistir.'
}
