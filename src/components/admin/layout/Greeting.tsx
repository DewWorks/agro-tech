'use client'

import { useEffect, useState } from 'react'

interface GreetingProps {
  name: string
}

export default function Greeting({ name }: GreetingProps) {
  const [greeting, setGreeting] = useState('Olá')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('Bom dia')
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde')
    } else {
      setGreeting('Boa noite')
    }
  }, [])

  return (
    <h1 className="text-3xl font-bold tracking-tight text-[#1B4D3E]">
      {greeting}, {name}!
    </h1>
  )
}
