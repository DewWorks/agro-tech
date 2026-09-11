'use client';

import React from 'react';
import {
  TemplateRankingItem,
  ProducerRankingItem,
  PropertyRankingItem,
} from '@/actions/owner-dashboard';
import { FileStack, Users, MapPin, Award } from 'lucide-react';

interface RankingsSectionProps {
  templates: TemplateRankingItem[];
  producers: ProducerRankingItem[];
  properties: PropertyRankingItem[];
}

export default function RankingsSection({
  templates,
  producers,
  properties,
}: RankingsSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* 1. DOCUMENTOS MAIS EMITIDOS */}
      <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FileStack className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Mais Emitidos</h3>
              <p className="text-[11px] text-muted-foreground">Modelos mais demandados na esteira</p>
            </div>
          </div>

          <div className="mt-4 space-y-3.5">
            {templates.slice(0, 5).map((t, idx) => (
              <div key={t.templateCode} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-bold text-gray-400 text-[11px] w-4">{idx + 1}º</span>
                    <span className="font-medium text-gray-800 truncate" title={t.title}>
                      {t.title}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-800 flex-shrink-0">
                    {t.count} <span className="text-[10px] text-gray-400 font-normal">({t.percentage}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                    style={{ width: `${Math.max(t.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Nenhum documento emitido registrado.
              </p>
            )}
          </div>
        </div>

        {templates.length > 0 && (
          <div className="mt-4 pt-3 border-t text-[11px] text-gray-400 flex items-center justify-between">
            <span>Total de tipos emitidos:</span>
            <span className="font-semibold text-gray-700">{templates.length} modelos</span>
          </div>
        )}
      </div>

      {/* 2. TOP PRODUTORES POR VOLUME */}
      <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Por Produtor</h3>
              <p className="text-[11px] text-muted-foreground">Clientes com maior volume de emissões</p>
            </div>
          </div>

          <div className="mt-4 space-y-3.5">
            {producers.slice(0, 5).map((p, idx) => (
              <div key={p.producerId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-bold text-gray-400 text-[11px] w-4">{idx + 1}º</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate" title={p.producerName}>
                        {p.producerName}
                      </p>
                      {p.document && (
                        <p className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                          {p.document}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-blue-700 flex-shrink-0">
                    {p.emissionsCount} <span className="text-[10px] text-gray-400 font-normal">docs</span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(p.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}

            {producers.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Nenhum produtor com emissões no escopo.
              </p>
            )}
          </div>
        </div>

        {producers.length > 0 && (
          <div className="mt-4 pt-3 border-t text-[11px] text-gray-400 flex items-center justify-between">
            <span>Produtores atendidos:</span>
            <span className="font-semibold text-gray-700">{producers.length} clientes</span>
          </div>
        )}
      </div>

      {/* 3. PROPRIEDADES BENEFICIADAS */}
      <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Por Propriedade</h3>
              <p className="text-[11px] text-muted-foreground">Imóveis rurais com mais minutas</p>
            </div>
          </div>

          <div className="mt-4 space-y-3.5">
            {properties.slice(0, 5).map((prop, idx) => (
              <div key={prop.propertyId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-bold text-gray-400 text-[11px] w-4">{idx + 1}º</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate" title={prop.propertyName}>
                        {prop.propertyName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {prop.location} • {prop.producerName}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-700 flex-shrink-0">
                    {prop.emissionsCount} <span className="text-[10px] text-gray-400 font-normal">docs</span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-600 transition-all duration-500"
                    style={{ width: `${Math.max(prop.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}

            {properties.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Nenhuma propriedade vinculada a emissões.
              </p>
            )}
          </div>
        </div>

        {properties.length > 0 && (
          <div className="mt-4 pt-3 border-t text-[11px] text-gray-400 flex items-center justify-between">
            <span>Propriedades ativas:</span>
            <span className="font-semibold text-gray-700">{properties.length} imóveis</span>
          </div>
        )}
      </div>
    </div>
  );
}
