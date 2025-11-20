import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Web3Provider } from '@/components/providers/web3provider'
import { NetworkSwitchModal } from '@/components/modals/network-switch-modal'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BlockDAG Multisig Factory - Secure Treasury Management',
  description: 'Deploy percentage-based multisig wallets with timelocks and batch confirmations on Base sepolia',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Web3Provider>
          <LayoutClient>{children}</LayoutClient>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}

function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NetworkSwitchModal />
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
