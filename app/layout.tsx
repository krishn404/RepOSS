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
// Use the shared OG image in /public so all social platforms (Twitter, WhatsApp, Discord, LinkedIn, etc.)
// get the same preview when a reposs link is shared. The query param is a build-time
// version marker to avoid caching mismatches without changing per-request.
const OG_IMAGE_VERSION = "v1"
const ogImage = `${siteUrl}/og-image.jpg?${OG_IMAGE_VERSION}`

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
        secureUrl: ogImage,
        type: "image/jpeg",
        width: 1200,
        height: 630,
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
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "reposs - Discover Open Source",
      },
    ],
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
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
