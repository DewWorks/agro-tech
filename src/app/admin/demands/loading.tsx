import React from 'react'
import { Skeleton } from '@/components/ui/skeletons'
import { DemandKanbanSkeleton } from '@/components/demands/DemandBoardSkeleton'

export default function DemandsLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Metrics Ribbon Skeleton */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-8 w-52 rounded-full" />
        <Skeleton className="h-8 w-56 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-xl" />
      </div>

      {/* Filters Bar Skeleton */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          <Skeleton className="h-9 flex-1 min-w-[200px] rounded-xl" />
          <Skeleton className="h-9 w-[180px] rounded-xl" />
          <Skeleton className="h-9 w-[200px] rounded-xl" />
          <Skeleton className="h-9 w-[185px] rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* Kanban Board Skeleton */}
      <DemandKanbanSkeleton />
    </div>
  )
}
