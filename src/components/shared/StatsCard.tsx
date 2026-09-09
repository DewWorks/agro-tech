'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: string | number
    isPositive?: boolean
    label?: string
  }
  className?: string
}

export const StatsCard = React.memo(function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-emerald-700 bg-emerald-50 border-emerald-200',
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-all duration-200 hover:shadow-md', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          {Icon && (
            <div className={cn('p-2 rounded-xl border flex items-center justify-center', iconColor)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                trend.isPositive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'
