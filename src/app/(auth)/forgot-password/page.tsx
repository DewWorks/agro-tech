'use client'

import { useState } from 'react'
import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    setSuccess(false)
    const result = await resetPassword(formData)
    
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
    }
    setIsPending(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-[#1B4D3E]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1B4D3E]">E-mail Enviado</CardTitle>
          <CardDescription className="text-base">
            Enviámos um link de recuperação para o seu e-mail. Por favor, verifique a sua caixa de entrada e pasta de spam.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm font-medium text-[#1B4D3E] hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-none">
      <CardHeader className="space-y-2 text-center pb-8">
        <CardTitle className="text-2xl font-bold text-[#1B4D3E]">Recuperar Senha</CardTitle>
        <CardDescription>
          Introduza o seu e-mail corporativo e enviar-lhe-emos um link para redefinir a sua senha.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <FormAlert type="error" message={error || ''} />
          <div className="space-y-2 text-left">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="seu.nome@lnconsultoria.com" 
              required 
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            type="submit" 
            className="w-full bg-[#1B4D3E] hover:bg-[#13382D]"
            disabled={isPending}
          >
            {isPending ? 'A enviar...' : 'Enviar Link de Recuperação'}
          </Button>
          <Link href="/login" className="text-sm text-center text-gray-500 hover:text-[#1B4D3E] hover:underline flex items-center justify-center gap-2 w-full">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
