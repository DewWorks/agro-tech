import React from 'react'
import {
  Landmark,
  Beef,
  Tractor,
  Scale,
  Building2,
  Wheat,
  Sprout,
  CreditCard,
} from 'lucide-react'

export interface PurposeOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

export const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    value: 'CUSTEIO_AGRICOLA',
    label: 'Custeio Agrícola (Safra)',
    icon: Wheat,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'CUSTEIO_PECUARIO',
    label: 'Custeio Pecuário / Nutrição',
    icon: Beef,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    value: 'INVESTIMENTO_MAQUINAS',
    label: 'Investimento (Tratores & Máquinas)',
    icon: Tractor,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'INVESTIMENTO_SOLO_PASTAGEM',
    label: 'Reforma de Pastagens & Calagem',
    icon: Sprout,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'RETENCAO_MATRIZES',
    label: 'Retenção de Matrizes & Bezerros',
    icon: Scale,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'MISTO',
    label: 'Limite Misto / Rotativo de Crédito',
    icon: CreditCard,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
]

export interface BankOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

export const BANK_OPTIONS: BankOption[] = [
  {
    value: 'BANCO_DO_BRASIL',
    label: 'Banco do Brasil',
    icon: Landmark,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'SICREDI',
    label: 'Sicredi',
    icon: Building2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'SICOOB',
    label: 'Sicoob',
    icon: Building2,
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    value: 'BRADESCO_AGRO',
    label: 'Bradesco Agro',
    icon: Landmark,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    value: 'CAIXA_ECONOMICA',
    label: 'Caixa Econômica Federal',
    icon: Landmark,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'OUTRO',
    label: 'Outra Instituição',
    icon: Building2,
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
]
