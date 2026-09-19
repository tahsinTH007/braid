"use client";

import { SignUp, SignedIn, SignedOut } from "@clerk/nextjs";
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

export default function SignUpPage() {
  return (
    <>
      <SignedIn>
        {/* If user is already logged in, send them home instead of looping between auth pages */}
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
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Join the conversation in a few seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                afterSignUpUrl="/"
                appearance={clerkDarkAppearance}
              />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-primary">
                Sign In
              </Link>
            </p>
          </div>
        </main>
      </SignedOut>
    </>
  );
}
