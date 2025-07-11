"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Sign in to your account to continue engaging with the community
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl border border-white/20 sm:rounded-2xl sm:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative z-10">
            <SignIn
              afterSignInUrl="/blogs"
              redirectUrl="/blogs"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "w-full border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-xl font-medium py-3 px-4",
                  socialButtonsBlockButtonText: "font-medium text-gray-700",
                  formButtonPrimary:
                    "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105",
                  formFieldInput:
                    "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm",
                  formFieldLabel: "text-gray-700 font-medium",
                  footerActionLink:
                    "text-blue-600 hover:text-purple-600 font-medium transition-colors duration-200",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 font-medium",
                  identityPreviewText: "text-gray-600",
                  identityPreviewEditButton:
                    "text-blue-600 hover:text-purple-600",
                  formResendCodeLink: "text-blue-600 hover:text-purple-600",
                  otpCodeFieldInput:
                    "border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
              }}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Do not have an account?{" "}
            <a
              href="/sign-up"
              className="text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-200 hover:underline"
            >
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
