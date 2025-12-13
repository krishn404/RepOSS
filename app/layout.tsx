import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { AppSessionProvider } from "@/components/session-provider"

import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reposs.xyz"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "reposs - Discover Open Source",
    template: "%s | reposs",
  },
  description: "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",
  keywords: [
    "open source",
    "GitHub",
    "repositories",
    "open source projects",
    "developer tools",
    "code discovery",
    "GitHub search",
    "open source discovery",
  ],
  authors: [{ name: "reposs" }],
  creator: "reposs",
  publisher: "reposs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "reposs - Discover Open Source",
    description: "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",
    siteName: "reposs",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "reposs - Discover Open Source",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "reposs - Discover Open Source",
    description: "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",
    images: ["/og-image.jpg"],
    creator: "@reposs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={inter.className}>
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        ) : null}
        <AppSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Suspense>{children}</Suspense>
            <Toaster />
          </ThemeProvider>
        </AppSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
