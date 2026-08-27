'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#fdfaf9', color: '#071b4d', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ margin: '18vh auto', maxWidth: 560, padding: 24, textAlign: 'center' }}>
          <img
            src="/brand/student-social-icon.webp"
            alt="Student.social"
            width="96"
            height="96"
            style={{ display: 'block', width: '96px', height: '96px', objectFit: 'contain', margin: '0 auto 28px' }}
          />
          <h1 style={{ marginBottom: 10 }}>Student.social could not start</h1>
          <p style={{ color: '#5e6677', lineHeight: 1.6 }}>Refresh the application or try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 18, border: 0, borderRadius: 999, background: '#071b4d', color: '#fff', padding: '11px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
