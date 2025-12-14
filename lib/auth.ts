import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { ConvexHttpClient } from "convex/browser"

// Helper to save user profile to Convex
async function saveUserToConvex(user: any, account: any) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not set, skipping user profile save")
    return
  }

  try {
    const convex = new ConvexHttpClient(convexUrl)
    
    // Save or update user profile
    await convex.mutation("users:createOrUpdateUser" as any, {
      userId: user.id,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      image: user.image ?? undefined,
      provider: account?.provider ?? "unknown",
      providerAccountId: account?.providerAccountId ?? account?.id ?? user.id,
    })

    // Log login activity
    try {
      await convex.mutation("activities:logActivity" as any, {
        userId: user.id,
        activityType: "login",
        details: {
          preferenceValue: account?.provider ?? "unknown",
        },
      })
    } catch (activityError) {
      console.error("Failed to log login activity:", activityError)
      // Don't fail user save if activity logging fails
    }
  } catch (error) {
    console.error("Failed to save user to Convex:", error)
    // Don't throw - auth should still succeed even if Convex save fails
  }
}

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,

  callbacks: {
    async signIn({ user, account }) {
      // Save user profile to Convex on sign in
      if (user && account) {
        await saveUserToConvex(user, account)
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.provider = account?.provider
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string | undefined
        session.user.name = token.name as string | undefined
        session.user.image = token.image as string | undefined
      }
      return session
    },
  },
}
