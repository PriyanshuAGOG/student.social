'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ margin: '20vh auto', maxWidth: 560, padding: 24, textAlign: 'center' }}>
          <h1>PeerSpark could not start</h1>
          <p>Refresh the application or try again in a moment.</p>
          <button type="button" onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  )
}
