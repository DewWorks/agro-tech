'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    const result = await login(formData)
    // Se o login for bem-sucedido, o 'redirect' ira ocorrer no backend, logo o codigo abaixo nao sera alcancado.
    // Se houver erro, mostramos o erro:
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-none">
      <CardHeader className="space-y-2 text-center pb-8">
        <CardTitle className="text-3xl font-bold text-[#1B4D3E]">AgroTech</CardTitle>
        <CardDescription>Plataforma Unificada de Crédito Rural</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2 text-left">
            <Label htmlFor="email">E-mail Corporativo</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="seu.nome@lnconsultoria.com" 
              required 
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-[#1B4D3E] hover:bg-[#13382D]"
            disabled={isPending}
          >
            {isPending ? 'A autenticar...' : 'Entrar no Sistema'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
