/**
 * Utilitário de Compressão Client-side de Documentos (PDF e Imagens)
 * Permite comprimir arquivos antes do upload para economizar banda e armazenamento.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  reductionPercentage: number;
  wasCompressed: boolean;
}

/**
 * Comprime uma imagem usando HTML Canvas e reamostragem bilinear.
 */
async function compressImage(file: File, maxDimension = 2048, quality = 0.82): Promise<File | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Redimensionamento proporcional se exceder a dimensão máxima
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Fundo branco para imagens com transparência convertidas para JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Usar image/jpeg para máxima compressão
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          // Se o resultado for menor que o original, cria o novo File
          if (blob.size < file.size) {
            const ext = file.name.substring(file.name.lastIndexOf('.'));
            const baseName = file.name.replace(ext, '');
            const newName = `${baseName}.jpg`;
            const compressedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(null); // Original já é mais leve
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Comprime um arquivo PDF utilizando pdf-lib com compressão de Object Streams.
 */
async function compressPdf(file: File): Promise<File | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

    if (compressedBytes.length < file.size) {
      const buffer = new Uint8Array(compressedBytes).buffer as ArrayBuffer;
      return new File([buffer], file.name, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });
    }
    return null;
  } catch (error) {
    console.warn('[Compressor] Não foi possível otimizar PDF client-side:', error);
    return null;
  }
}

/**
 * Ponto de entrada para compressão automática de documentos.
 */
export async function compressDocumentFile(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    let compressedFile: File | null = null;

    if (file.type.startsWith('image/')) {
      compressedFile = await compressImage(file);
    } else if (file.type === 'application/pdf') {
      compressedFile = await compressPdf(file);
    }

    if (compressedFile && compressedFile.size < originalSize) {
      const compressedSize = compressedFile.size;
      const savedBytes = originalSize - compressedSize;
      const reductionPercentage = Number(((savedBytes / originalSize) * 100).toFixed(1));

      return {
        file: compressedFile,
        originalSize,
        compressedSize,
        savedBytes,
        reductionPercentage,
        wasCompressed: true,
      };
    }
  } catch (error) {
    console.warn('[Compressor] Erro durante compressão client-side:', error);
  }

  // Se não foi comprimido, retorna o arquivo original sem alteração
  return {
    file,
    originalSize,
    compressedSize: originalSize,
    savedBytes: 0,
    reductionPercentage: 0,
    wasCompressed: false,
  };
}
