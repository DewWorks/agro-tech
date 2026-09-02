import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800", className)}
      {...props}
    />
  )
}

export function TableSkeleton({
  rows = 6,
  columns = 7,
  showToolbar = false,
  showTabs = false,
}: {
  rows?: number
  columns?: number
  showToolbar?: boolean
  showTabs?: boolean
}) {
  return (
    <div className="space-y-4 w-full animate-in fade-in duration-150">
      {showTabs && (
        <div className="flex items-center gap-2 pb-2 border-b">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      )}

      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <Skeleton className="h-9 w-full max-w-sm rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md hidden sm:block" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-xs overflow-hidden">
        <div className="border-b bg-slate-50/70 p-4 flex items-center justify-between">
          {Array.from({ length: columns }).map((_, idx) => (
            <Skeleton 
              key={`th-${idx}`} 
              className={`h-4 ${idx === 0 ? 'w-36' : idx === columns - 1 ? 'w-16' : 'w-24'}`} 
            />
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={`tr-${r}`} className="p-4 flex items-center justify-between">
              {Array.from({ length: columns }).map((_, c) => (
                <div key={`td-${r}-${c}`} className="space-y-1.5">
                  <Skeleton 
                    className={`h-4 ${
                      c === 0 ? 'w-40' : c === 1 ? 'w-28' : c === columns - 1 ? 'w-8 ml-auto' : 'w-20'
                    }`} 
                  />
                  {c === 0 && <Skeleton className="h-3 w-24" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="h-full bg-white border rounded-2xl overflow-hidden shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-11 w-11 rounded-2xl bg-emerald-100/60" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FormSkeleton({ tabsCount = 4 }: { tabsCount?: number }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      <div className="bg-white rounded-xl shadow-xs border p-6 space-y-6">
        <div className="flex border-b border-gray-200 gap-2 pb-2 overflow-x-auto">
          {Array.from({ length: tabsCount }).map((_, i) => (
            <Skeleton key={`t-${i}`} className={`h-9 ${i === 0 ? 'w-36 bg-emerald-100/70' : 'w-28'} rounded-lg`} />
          ))}
        </div>

        <div className="p-5 border rounded-xl bg-white shadow-xs space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md bg-[#1B4D3E]/30" />
        </div>
      </div>
    </div>
  )
}

export function UniversalPageSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-96 mt-1" />
      </div>
      <TableSkeleton rows={6} columns={7} showToolbar={true} />
    </div>
  )
}
