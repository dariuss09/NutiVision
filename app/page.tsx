"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="NutriVision Logo" className="w-32 h-32 mb-6 rounded-2xl shadow-xl shadow-emerald-500/10" />
      <h1 className="text-4xl font-bold mb-8 text-white">Welcome to NutriVision</h1>
      
      <div className="flex flex-col items-center gap-6 min-h-[120px]">
        <p className="text-slate-400 mb-2 text-center px-4 max-w-md">
          Your personal AI nutritionist and fitness tracker.
        </p>

        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          {isLoaded && isSignedIn && (
            <p className="text-emerald-400 font-medium bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              ✓ You are securely signed in
            </p>
          )}
          
          {/* 
            By using a standard Link instead of Clerk's <SignInButton mode="modal">, 
            we completely bypass the Mobile IP blocks! If the user clicks this, 
            Next.js server-side middleware will securely redirect them to the Clerk login page 
            even if the client-side scripts are blocked.
          */}
          <Link 
            href="/dashboard" 
            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 text-center"
          >
            {(isLoaded && isSignedIn) ? "Enter NutriVision" : "Sign In with Google"}
          </Link>
        </div>

      </div>
    </main>
  );
}
