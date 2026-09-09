import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * Função para injetar dados em um arquivo DOCX preservando a formatação original.
 * 
 * @param templateBuffer Buffer binário do arquivo .docx original lido do Supabase/Disco.
 * @param data Dicionário de chave/valor para injetar nas tags {{NOME_VARIAVEL}}
 * @returns Buffer binário do novo .docx gerado.
 */
export function renderDocxTemplate(templateBuffer: Buffer, data: Record<string, any>): Buffer {
  const zip = new PizZip(templateBuffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Substitui as tags (e.g. {{PRODUCER_NAME}}) pelos dados passados no dicionário
  doc.render(data);

  // Gera o novo documento binário (compactado)
  const out = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return out;
}
