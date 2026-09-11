'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle2, ArrowDownCircle, FileText } from 'lucide-react';
import { compressExistingDocuments, CompressionResultItem } from '@/actions/documents';
import { formatFileSize } from '@/lib/ged/utils';
import { toast } from 'sonner';

interface OptimizeExistingDocsButtonProps {
  currentBranchId?: string;
}

interface OptimizationSummary {
  processedCount: number;
  optimizedCount: number;
  originalTotal: number;
  compressedTotal: number;
  totalSavedBytes: number;
  totalSavedPercentage: number;
  details: CompressionResultItem[];
}

export default function OptimizeExistingDocsButton({
  currentBranchId,
}: OptimizeExistingDocsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<OptimizationSummary | null>(null);

  const handleStartOptimization = async () => {
    setIsRunning(true);
    setSummary(null);

    try {
      const res = await compressExistingDocuments(currentBranchId);
      if (!res.success) {
        throw new Error(res.error || 'Falha ao otimizar documentos.');
      }

      setSummary({
        processedCount: res.processedCount || 0,
        optimizedCount: res.optimizedCount || 0,
        originalTotal: res.originalTotal || 0,
        compressedTotal: res.compressedTotal || 0,
        totalSavedBytes: res.totalSavedBytes || 0,
        totalSavedPercentage: res.totalSavedPercentage || 0,
        details: res.details || [],
      });

      if ((res.optimizedCount || 0) > 0) {
        toast.success(
          `Otimização concluída! ${res.optimizedCount} documentos comprimidos. Economia de ${formatFileSize(
            res.totalSavedBytes || 0
          )}.`
        );
      } else {
        toast.info('Todos os documentos já estavam no tamanho ideal e otimizado!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar otimização.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setSummary(null);
          setIsOpen(true);
        }}
        size="sm"
        className="bg-emerald-800 hover:bg-emerald-900 text-white font-medium flex items-center gap-1.5 shadow-sm text-xs h-9"
      >
        <Sparkles className="h-4 w-4 text-emerald-300" />
        Otimizar Documentos Existentes
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !isRunning && setIsOpen(open)}>
        <DialogContent className="w-full sm:max-w-[620px] p-6 overflow-hidden gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-950 text-lg">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Compressão e Otimização em Lote
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Aplica compressão de alta performance (sem perda de legibilidade) a todos os PDFs e imagens
              já arquivados no repositório Supabase Storage.
            </DialogDescription>
          </DialogHeader>

          {!summary && !isRunning && (
            <div className="py-2 space-y-3 text-sm text-gray-600">
              <p className="text-xs text-gray-600">
                Essa rotina analisa cada documento anexado no sistema:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                <li>PDFs são re-empacotados com compactação de Object Streams (pdf-lib).</li>
                <li>Imagens (fotos de RG, CNH, matrículas) são reamostradas para 2048px com alta fidelidade (Sharp).</li>
                <li>Caso o arquivo já esteja no tamanho ideal, ele não será alterado.</li>
              </ul>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>O banco de dados e os arquivos do Storage serão atualizados em tempo real.</span>
              </div>
            </div>
          )}

          {isRunning && (
            <div className="py-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              <p className="font-semibold text-gray-800 text-sm">Comprimindo documentos existentes...</p>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Baixando do Supabase, processando buffers com Sharp e pdf-lib, e atualizando repositório.
              </p>
            </div>
          )}

          {summary && !isRunning && (
            <div className="space-y-4 py-1 w-full min-w-0">
              <div className="grid grid-cols-3 gap-3 w-full min-w-0">
                <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-3 flex flex-col items-center justify-center text-center min-w-0">
                  <span className="text-[11px] font-medium text-gray-500 truncate w-full">Total Analisado</span>
                  <span className="text-xl font-bold text-gray-800 mt-1">{summary.processedCount}</span>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex flex-col items-center justify-center text-center min-w-0">
                  <span className="text-[11px] font-semibold text-emerald-800 truncate w-full">Otimizados</span>
                  <span className="text-xl font-bold text-emerald-800 mt-1">{summary.optimizedCount}</span>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex flex-col items-center justify-center text-center min-w-0">
                  <span className="text-[11px] font-semibold text-blue-800 truncate w-full">Espaço Poupado</span>
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-base font-black text-blue-900 leading-tight">
                      {formatFileSize(summary.totalSavedBytes)}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600">
                      (-{summary.totalSavedPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {summary.details.length > 0 ? (
                <div className="space-y-2 w-full min-w-0">
                  <h4 className="text-xs font-semibold text-gray-700">Documentos que foram reduzidos:</h4>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-gray-200 rounded-lg p-2 bg-gray-50/50 w-full min-w-0">
                    {summary.details.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-md border border-gray-100 shadow-2xs w-full min-w-0"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <FileText className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                          <span className="truncate font-medium text-gray-800 text-xs" title={d.fileName}>
                            {d.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 text-right whitespace-nowrap ml-2">
                          <span className="text-[11px] text-gray-400">
                            {formatFileSize(d.originalSize)} → <strong className="text-gray-700">{formatFileSize(d.compressedSize)}</strong>
                          </span>
                          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                            -{d.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-gray-50 p-4 text-center text-xs text-gray-500">
                  Nenhum documento exigiu redução adicional. Todos os arquivos já estão perfeitamente otimizados!
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 w-full">
            {!summary && !isRunning ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white"
                  onClick={handleStartOptimization}
                >
                  <ArrowDownCircle className="mr-1.5 h-4 w-4" />
                  Iniciar Otimização
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isRunning}
              >
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
