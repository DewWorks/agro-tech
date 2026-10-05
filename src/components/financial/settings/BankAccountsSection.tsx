'use client'

import React from 'react'
import { PlusCircle, ArrowRightLeft, Landmark, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface BankAccountsSectionProps {
  bankAccounts: any[]
  onOpenNewAccount: () => void
  onOpenTransfer: () => void
}

export default function BankAccountsSection({
  bankAccounts,
  onOpenNewAccount,
  onOpenTransfer,
}: BankAccountsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Contas Bancárias & Caixas de Tesouraria
          </h3>
          <p className="text-xs text-slate-500">
            Saldos correntes em tempo real e transferências internas entre contas da empresa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bankAccounts.length >= 2 && (
            <Button
              onClick={onOpenTransfer}
              variant="outline"
              className="gap-1.5 text-xs font-bold text-slate-700"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transferência Interna
            </Button>
          )}

          <Button
            onClick={onOpenNewAccount}
            className="bg-emerald-800 hover:bg-emerald-900 text-white gap-1.5 text-xs font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            Cadastrar Conta / Caixa
          </Button>
        </div>
      </div>

      {/* Cards das Contas Cadastradas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bankAccounts.map((acc) => {
          const balance = Number(acc.currentBalance) || 0
          const isPhysical = acc.accountType === 'CAIXA_ESPECIE'

          return (
            <div
              key={acc.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-lg p-2 ${
                        isPhysical
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPhysical ? (
                        <Wallet className="h-4 w-4" />
                      ) : (
                        <Landmark className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{acc.bankName}</div>
                      <div className="text-[10px] text-slate-400">
                        {acc.branch ? acc.branch.name : 'Grupo LN'}
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                    {acc.accountType}
                  </span>
                </div>

                {!isPhysical && (
                  <div className="mt-3 text-xs text-slate-500 font-mono">
                    Ag.: {acc.agency || 'S/A'} • CC: {acc.accountNumber || 'S/N'}
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Saldo Disponível
                </span>
                <div
                  className={`text-xl font-black mt-0.5 ${
                    balance >= 0 ? 'text-emerald-800' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(balance)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
