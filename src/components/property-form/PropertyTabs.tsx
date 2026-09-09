'use client';

import { useState } from 'react';
// import { useFieldArray, useForm } from 'react-hook-form';

export function PropertyTabs() {
  const [activeTab, setActiveTab] = useState('dados');

  // Num cenário real usaríamos o react-hook-form com zodResolver
  // const { control, register } = useForm();
  // const { fields, append, remove } = useFieldArray({ control, name: 'landUses' });

  return (
    <div className="w-full max-w-4xl bg-white border rounded-lg shadow-sm">
      
      {/* HEADER DE ABAS */}
      <div className="flex border-b overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dados')}
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'dados' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
        >
          Dados Gerais
        </button>
        <button 
          onClick={() => setActiveTab('uso')}
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'uso' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
        >
          Uso do Solo
        </button>
        <button 
          onClick={() => setActiveTab('benfeitorias')}
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'benfeitorias' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
        >
          Benfeitorias
        </button>
        <button 
          onClick={() => setActiveTab('maquinas')}
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'maquinas' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
        >
          Máquinas
        </button>
        <button 
          onClick={() => setActiveTab('rebanho')}
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'rebanho' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}
        >
          Rebanho
        </button>
      </div>

      {/* CONTEÚDO */}
      <div className="p-6">
        
        {activeTab === 'dados' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Identificação e Posse</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Área Consolidada (ha)</label>
                <input type="number" className="mt-1 block w-full rounded border-gray-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm">Módulos Rurais</label>
                <input type="number" className="mt-1 block w-full rounded border-gray-300 border p-2" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="hasInsurance" />
                <label htmlFor="hasInsurance">Possui Seguro?</label>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="hasLien" />
                <label htmlFor="hasLien">Possui Gravame?</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'uso' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Tabela de Uso do Solo (Mini-ERP)</h3>
              <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded font-medium text-sm">
                + Adicionar Linha
              </button>
            </div>
            {/* O Grid Interativo (useFieldArray representation) */}
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2">Tipo de Uso</th>
                  <th className="p-2">Característica</th>
                  <th className="p-2">Quantidade (ha)</th>
                  <th className="p-2">V. Unitário (R$)</th>
                  <th className="p-2">V. Total (R$)</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-2"><select className="border rounded p-1 w-full"><option>LAVOURA_ANUAL</option></select></td>
                  <td className="p-2"><input type="text" className="border rounded p-1 w-full" defaultValue="Soja" /></td>
                  <td className="p-2"><input type="number" className="border rounded p-1 w-full" defaultValue="200" /></td>
                  <td className="p-2"><input type="number" className="border rounded p-1 w-full" defaultValue="15000" /></td>
                  <td className="p-2 font-medium text-gray-700">R$ 3.000.000,00</td>
                  <td className="p-2 text-red-500 cursor-pointer">Remover</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'benfeitorias' || activeTab === 'maquinas' || activeTab === 'rebanho') && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p>Os grids dinâmicos (useFieldArray) para {activeTab} seguirão a mesma estrutura estrutural acima.</p>
          </div>
        )}
      </div>

    </div>
  );
}
