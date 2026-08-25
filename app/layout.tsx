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

const publicSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const publicSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif" })

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studentsocial.vercel.app"

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
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
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
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Student.social logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student.social — Learning is better with people',
    description: 'Find study circles, build a shared learning rhythm, and get thoughtful AI support.',
    images: ['/logo.png'],
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
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="mask-icon" href="/placeholder-icon.png" color="#000000" />
      </head>
      <body className={`${publicSans.variable} ${publicSerif.variable}`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <ServiceWorkerRegister />
            <ClientErrorReporter />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
