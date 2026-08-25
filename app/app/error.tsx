'use client'

import { Button } from '@/components/ui/button'

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-2xl font-semibold">This workspace view hit an error</h2>
      <p className="max-w-md text-muted-foreground">Try loading the view again. If it keeps failing, the correlation ID in server logs can identify the request.</p>
      <Button onClick={reset}>Reload view</Button>
    </section>
  )
}
