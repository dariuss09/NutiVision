import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '../components/ConvexClientProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'NutriVision',
  description: 'AI-Powered Nutrition & Fitness Tracker',
  applicationName: 'NutriVision',
  appleWebApp: {
    capable: true,
    title: 'NutriVision',
    statusBarStyle: 'black-translucent',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden bg-slate-950 text-slate-50`}>
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
