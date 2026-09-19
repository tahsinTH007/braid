"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

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
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8">
            <h1 className="text-3xl font-bold text-center">Welcome Back</h1>

            <div className="rounded-2xl border p-6">
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                afterSignInUrl="/"
              />
            </div>

            <p className="text-center text-xs">
              New here?{" "}
              <Link href="/sign-up" className="text-primary font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </main>
      </SignedOut>
    </>
  );
}
