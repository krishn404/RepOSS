"use client"

import React from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { FcGoogle } from "react-icons/fc"
import { BsGithub } from "react-icons/bs"
import Link from "next/link"
import Beams from "./Beams"

export default function SignInPage() {
  const [isLoading, setIsLoading] = React.useState<string | null>(null)

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider)
    try {
      await signIn(provider, { redirect: true, callbackUrl: "/opensource" })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={30}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <Card
      className="
        w-full max-w-md
        bg-black/20
        backdrop-blur-xl
        border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      "
    >
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          reposs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign in to explore open-source projects
        </p>
      </CardHeader>

      <CardContent className="space-y-3">

        <Button
          onClick={() => handleSignIn("github")}
          disabled={isLoading !== null}
          className="w-full gap-2"
          size="lg"
        >
          <BsGithub className="w-5 h-5" />
          {isLoading === "github" ? "Signing in..." : "Continue with GitHub"}
        </Button>

        <Button
          onClick={() => handleSignIn("google")}
          disabled={isLoading !== null}
          variant="outline"
          className="
            w-full gap-2
            border-white/20
            text-white
            hover:bg-white/5
          "
          size="lg"
        >
          <FcGoogle className="w-5 h-5" />
          {isLoading === "google" ? "Signing in..." : "Continue with Google"}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
            <span className="bg-black/20 px-2 text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <Link href="/opensource" className="block">
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-white"
          >
            Continue as Guest
          </Button>
        </Link>

        <p className="text-center text-[10px] text-muted-foreground mt-1">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
      </div>
    </div>
  )
}
