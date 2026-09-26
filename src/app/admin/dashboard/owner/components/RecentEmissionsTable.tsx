'use client';

import React from 'react';
import { RecentEmissionItem } from '@/actions/owner-dashboard';
import { FileCheck2, User, MapPin, Building2, Calendar } from 'lucide-react';

interface RecentEmissionsTableProps {
  emissions: RecentEmissionItem[];
}

export default function RecentEmissionsTable({ emissions }: RecentEmissionsTableProps) {
  if (emissions.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        <FileCheck2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="font-medium text-gray-700">Nenhuma emissão registrada até o momento.</p>
        <p className="text-xs text-gray-400 mt-1">
          Ao emitir ou baixar relatórios de crédito e declarações, os registros aparecerão aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Histórico de Emissões Recentes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro cronológico das últimas Declarações Legais e projetos técnicos gerados na franquia
          </p>
        </div>
        <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
          {emissions.length} registros exibidos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/75 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Documento / Modelo</th>
              <th className="py-3 px-4">Produtor Rural</th>
              <th className="py-3 px-4">Propriedade</th>
              <th className="py-3 px-4">Filial</th>
              <th className="py-3 px-4 text-right">Data / Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {emissions.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 line-clamp-1">{item.templateTitle}</p>
                      <span className="text-[10px] font-mono text-gray-400">{item.templateCode}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">{item.producerName}</p>
                      {item.producerDoc && (
                        <p className="text-[11px] font-mono text-gray-500 whitespace-nowrap">
                          {item.producerDoc}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate max-w-[160px]">
                      {item.propertyName || 'Sem vínculo fundiário'}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px]">{item.branchName}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1 text-gray-500 whitespace-nowrap">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>{item.createdAt}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
