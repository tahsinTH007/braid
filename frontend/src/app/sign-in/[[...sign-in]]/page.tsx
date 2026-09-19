"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { clerkDarkAppearance } from "@/lib/clerk-appearance";

function RedirectHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}

export default function SignInPage() {
  return (
    <>
      <SignedIn>
        <RedirectHome />
      </SignedIn>

      <SignedOut>
        <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4">
          <Link href="/">
            <Logo markClassName="h-10 w-10" wordmarkClassName="text-2xl" />
          </Link>

          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to keep the conversation going.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                afterSignInUrl="/"
                appearance={clerkDarkAppearance}
              />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              New here?{" "}
              <Link href="/sign-up" className="font-medium text-primary">
                Sign Up
              </Link>
            </p>
          </div>
        </main>
      </SignedOut>
    </>
  );
}
