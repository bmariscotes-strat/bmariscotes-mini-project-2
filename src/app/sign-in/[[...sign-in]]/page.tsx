"use client";

import { SignIn } from "@clerk/nextjs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Header />
      <main className="px-4 py-4 sm:px-6 sm:py-4 md:py-4 lg:py-8 lg:px-8 flex-1">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center flex flex-col justify-center items-center">
            <Image
              src="/vectors/glasses-notes.png"
              alt="Logo"
              width={150}
              height={150}
            />
            <h1 className="text-3xl font-bold text-primary mb-2">
              Welcome Back<span className="sm:inline hidden">, Wryter!</span>
            </h1>
            <p className="text-gray-600 mb-5">
              Pick up where you left off
              <span className="sm:inline hidden">
                {" "}
                and keep your story going.
              </span>
            </p>
          </div>

          <div className="bg-white pt-2 pb-8 md:py-8 lg:py-4 sm:rounded-lg sm:px-10t">
            {/* Clerk Sign In */}
            <SignIn
              afterSignInUrl="/blogs"
              redirectUrl="/blogs"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0",
                  header: "hidden",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  cardBox: "pt-0",
                  developmentModeWarning: "hidden",
                  footerAttribution: "hidden",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
                variables: {
                  colorPrimary: "#6d67c1",
                  colorText: "#374151",
                  colorTextSecondary: "#6b7280",
                  colorBackground: "#ffffff",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#374151",
                  borderRadius: "0.375rem",
                  spacingUnit: "1rem",
                },
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
