import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const TEMPLATE_FILE_MAP: Record<string, { fileName: string; contentType: string }> = {
  CHECKLIST_PROFISSIONAL: {
    fileName: '1 -Check Liste Profissional.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  LIMITE_CREDITO_BB: {
    fileName: '2 - Limite de Credito - Cadastro.xls',
    contentType: 'application/vnd.ms-excel'
  },
  PROJETO_RENOVAGRO: {
    fileName: '7 - Projeto - RenovAgro.doc',
    contentType: 'application/msword'
  },
  PROJETO_INOVAGRO: {
    fileName: '9 - Projeto - Inovagro.xls',
    contentType: 'application/vnd.ms-excel'
  },
  PROJETO_CUSTEIO_SAFRA: {
    fileName: '5 - Projeto de Custeio - Safra 2026-2027.xlsm',
    contentType: 'application/vnd.ms-excel.sheet.macroEnabled.12'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code || !TEMPLATE_FILE_MAP[code]) {
    return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
  }

  const { fileName, contentType } = TEMPLATE_FILE_MAP[code]
  const filePath = path.resolve(process.cwd(), '..', 'spec', 'docs', 'rural-tech', fileName)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Arquivo template não encontrado no servidor' }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filePath)

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': fileBuffer.length.toString()
    }
  })
}
