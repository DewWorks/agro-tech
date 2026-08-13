import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B4D3E]" />
        <p className="text-sm font-medium">A carregar os dados...</p>
      </div>
    </div>
  )
}
