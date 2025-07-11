"use client";

import { SignUp } from "@clerk/nextjs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Header />
      <main className="px-4 py-12 sm:px-6 lg:px-8 flex-1">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Join Wryte Community
            </h1>
            <p className="text-gray-600 mb-5">
              Join us and give voice to your stories, one blog at a time.
            </p>
          </div>

          <div className="bg-white py-8 sm:rounded-lg sm:px-10">
            <SignUp
              afterSignUpUrl="/blogs"
              appearance={{
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
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0",
                  header: "hidden", // Hide entire header
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  // Remove any spacing from header area
                  cardBox: "pt-0",
                  developmentModeWarning: "hidden",
                  footerAttribution: "hidden",
                },
              }}
            />
          </div>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Benefits of joining
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  Join Discussions
                </h3>
                <p className="text-xs text-gray-500">
                  Comment and reply to posts
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  Like & Share
                </h3>
                <p className="text-xs text-gray-500">
                  Show appreciation for content
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  Inspire Readers
                </h3>
                <p className="text-xs text-gray-500">
                  Share your voice with the world
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
