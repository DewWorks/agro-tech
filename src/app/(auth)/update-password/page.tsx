'use client'

import { useState } from 'react'
import { updatePassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.')
      setIsPending(false)
      return
    }

    const result = await updatePassword(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-none">
      <CardHeader className="space-y-2 text-center pb-8">
        <CardTitle className="text-2xl font-bold text-[#1B4D3E]">Nova Senha</CardTitle>
        <CardDescription>
          Introduza a sua nova palavra-passe para aceder à plataforma.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <FormAlert type="error" message={error || ''} />
          <div className="space-y-2 text-left">
            <Label htmlFor="password">Nova Senha</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              minLength={6}
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-[#1B4D3E] hover:bg-[#13382D]"
            disabled={isPending}
          >
            {isPending ? 'A atualizar...' : 'Atualizar Senha'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
