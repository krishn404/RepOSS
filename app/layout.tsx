import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ConvexClientProvider } from "@/components/convex-provider"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { AppSessionProvider } from "@/components/session-provider"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = "https://reposs.xyz"

/**
 * IMPORTANT:
 * - og-image.jpg → used for WhatsApp, Discord, LinkedIn, Facebook
 * - og-twitter.jpg → used ONLY for Twitter to break cache permanently
 * Both files must exist in /public
 * 
 * Twitter cache-busting: Add version query param to force refresh
 * Update this version number whenever you change the OG image
 */
const ogImage = `${siteUrl}/og-image.jpg`
// Add cache-busting version parameter - increment this when image changes
const TWITTER_IMAGE_VERSION = "v2"
const twitterImage = `${siteUrl}/og-twitter.jpg?v=${TWITTER_IMAGE_VERSION}`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "reposs - Discover Open Source",
    template: "%s | reposs",
  },

  description:
    "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",

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
    url: siteUrl,
    title: "reposs - Discover Open Source",
    description:
      "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",
    siteName: "reposs",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "reposs - Discover Open Source",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@reposs",
    creator: "@reposs",
    title: "reposs - Discover Open Source",
    description:
      "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",
    images: [twitterImage],
  },

  /**
   * Twitter is extremely strict and sometimes ignores structured metadata.
   * These tags force-render even for stubborn cached URLs.
   * Using cache-busting query parameter to force Twitter to refresh.
   */
  other: {
    "twitter:card": "summary_large_image",
    "twitter:site": "@reposs",
    "twitter:creator": "@reposs",
    "twitter:title": "reposs - Discover Open Source",
    "twitter:description":
      "Explore, filter, and review GitHub repositories. Find the right open-source projects to learn from and contribute to.",
    "twitter:image": twitterImage,
    "twitter:image:src": twitterImage, // Alternative tag some scrapers use
    "twitter:image:alt": "reposs - Discover Open Source",
    "twitter:image:width": "1200",
    "twitter:image:height": "630",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

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
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        <AppSessionProvider>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <Suspense>{children}</Suspense>
              <Toaster />
            </ThemeProvider>
          </ConvexClientProvider>
        </AppSessionProvider>

        <Analytics />
      </body>
    </html>
  )
}
