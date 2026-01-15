import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PeerSpark - Collaborative Learning Platform",
  description: "Connect, learn, and grow with peers through collaborative study sessions and AI-powered insights.",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PeerSpark',
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
  creator: 'PeerSpark Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://peerspark.app',
    siteName: 'PeerSpark',
    title: 'PeerSpark - Collaborative Learning Platform',
    description: 'Connect, learn, and grow with peers through collaborative study sessions and AI-powered insights.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'PeerSpark Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PeerSpark - Collaborative Learning Platform',
    description: 'Connect, learn, and grow with peers through collaborative study sessions and AI-powered insights.',
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
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PeerSpark" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="mask-icon" href="/placeholder-icon.png" color="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to Jitsi for faster video calls - script loads dynamically when needed */}
        <link rel="preconnect" href="https://meet.jit.si" />
        <link rel="dns-prefetch" href="https://meet.jit.si" />
        <script src="/sw-register.js" defer></script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
