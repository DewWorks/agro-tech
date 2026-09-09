'use client';

import { useState, useTransition } from 'react';
import { submitDeltaForm } from '@/actions/delta-form';

export function DeltaFormModal({ 
  missingFields, 
  producerId, 
  propertyId, 
  templateCode, 
  branchId 
}: {
  missingFields: any[],
  producerId: string,
  propertyId: string,
  templateCode: string,
  branchId: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 🔒 Prevenção de Duplo Clique usando useTransition do React 18+
  const [isPending, startTransition] = useTransition();

  const handleEmit = (formData: FormData) => {
    // Coleta os dados do form
    const payload = Object.fromEntries(formData.entries());

    // Inicia a transição. Isso seta isPending = true e desabilita o botão imediatamente!
    startTransition(async () => {
      try {
        const result = await submitDeltaForm(
          branchId,
          'usr_1', // Mock do usuário
          producerId,
          templateCode,
          payload,
          propertyId
        );
        
        if (result.success) {
          alert('Documento enviado para geração!');
          setIsOpen(false);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao emitir');
      }
    });
  };

  if (!isOpen) return <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded">Gerar Documento</button>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-lg p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Dados Pendentes para Emissão</h2>
        <p className="text-sm text-gray-500 mb-6">
          Preencha os campos abaixo para gerar o documento. Eles serão salvos automaticamente no cadastro para uso futuro.
        </p>

        <form action={handleEmit} className="space-y-4">
          {missingFields.map((field) => (
            <div key={field.fieldName}>
              <label className="block text-sm font-medium text-gray-700">{field.label}</label>
              
              {field.type === 'select' ? (
                <select name={field.fieldName} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  {field.options?.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input 
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  name={field.fieldName} 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)} 
              className="px-4 py-2 border rounded text-gray-600"
              disabled={isPending}
            >
              Cancelar
            </button>
            
            {/* 🔒 Trava de Segurança UI: desabilitado e troca de cor ao enviar */}
            <button 
              type="submit" 
              disabled={isPending}
              className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPending ? 'Emitindo... Aguarde' : 'Confirmar e Emitir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
