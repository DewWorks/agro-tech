import fs from 'fs'
import path from 'path'

// Nível de log suportado
type LogLevel = 'info' | 'warn' | 'error'

/**
 * Função utilitária centralizada para registar eventos no servidor.
 * Em desenvolvimento, guarda fisicamente num ficheiro logs/system.log.
 * Em produção, envia apenas para o console.error (que será capturado pelos serviços de cloud).
 */
export function serverLog(level: LogLevel, context: string, error?: any, data?: any) {
  // Para evitar que seja executado no lado do cliente
  if (typeof window !== 'undefined') return

  const timestamp = new Date().toISOString()
  
  // Extração inteligente do erro para log seguro
  let errorDetails = ''
  if (error) {
    if (error instanceof Error) {
      errorDetails = `\n  - Message: ${error.message}\n  - Stack: ${error.stack}`
    } else if (typeof error === 'object') {
      errorDetails = `\n  - Object: ${JSON.stringify(error)}`
    } else {
      errorDetails = `\n  - Error: ${String(error)}`
    }
  }

  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}]${errorDetails}${data ? `\n  - Data: ${JSON.stringify(data)}` : ''}`

  // 1. Log no console nativo (bom para Vercel/Docker)
  if (level === 'error') {
    console.error(logMessage)
  } else if (level === 'warn') {
    console.warn(logMessage)
  } else {
    console.log(logMessage)
  }

  // 2. Log persistente em ficheiro (somente ambiente dev ou se permitido)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const logDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      const logFile = path.join(logDir, 'system.log')
      fs.appendFileSync(logFile, logMessage + '\n\n', 'utf8')
    } catch (fsError) {
      // Falha silenciosa no caso de não termos permissão de escrita
      console.error('Falha ao escrever no ficheiro de log local:', fsError)
    }
  }
}
