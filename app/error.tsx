'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[app-boundary]', error) }, [error])
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">The page could not be loaded. Your data was not changed.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
