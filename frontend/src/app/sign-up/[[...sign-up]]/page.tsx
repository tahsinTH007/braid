"use client";

import { SignUp, SignedIn, SignedOut } from "@clerk/nextjs";
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

export default function SignUpPage() {
  return (
    <>
      <SignedIn>
        {/* If user is already logged in, send them home instead of looping between auth pages */}
        <RedirectHome />
      </SignedIn>

      <SignedOut>
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8">
            <h1 className="text-3xl font-bold text-center">Create Account</h1>

            <div className="rounded-2xl border p-6">
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                afterSignUpUrl="/"
              />
            </div>

            <p className="text-center text-xs">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </main>
      </SignedOut>
    </>
  );
}
