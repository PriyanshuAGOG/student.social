import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Instrument_Serif } from "next/font/google"
import "@livekit/components-styles"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { ClientErrorReporter } from "@/components/admin/ClientErrorReporter"
import { ServiceWorkerRegister } from "@/components/sw-register"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

const publicSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const publicSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif" })

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studentssocial.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Student.social — Learning is better with people",
  description: "Find study circles, build a shared learning rhythm, and get thoughtful AI support with Student.social.",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Student.social',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  keywords: [
    'collaborative learning',
    'study pods',
    'peer learning',
    'education',
    'ai assistant',
    'video conference',
    'whiteboard',
  ],
  creator: 'Student.social',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    siteName: 'Student.social',
    title: 'Student.social — Learning is better with people',
    description: 'Find study circles, build a shared learning rhythm, and get thoughtful AI support.',
    images: [
      {
        url: '/brand/student-social-lockup.webp',
        width: 512,
        height: 171,
        alt: 'Student.social logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student.social — Learning is better with people',
    description: 'Find study circles, build a shared learning rhythm, and get thoughtful AI support.',
    images: ['/brand/student-social-lockup.webp'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2ece2' },
    { media: '(prefers-color-scheme: dark)', color: '#272521' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Student.social" />
        <meta name="msapplication-TileColor" content="#fdfaf9" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${publicSans.variable} ${publicSerif.variable}`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <ServiceWorkerRegister />
            <PWAInstallPrompt />
            <ClientErrorReporter />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
