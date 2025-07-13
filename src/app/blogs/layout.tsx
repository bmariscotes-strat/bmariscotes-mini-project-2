"use client";
import Link from "next/link";
import { ReactNode, useState } from "react";
import Image from "next/image";
import { UserCircle, LogOut, NotebookPen } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { AuthGuard } from "@/components/auth/AuthGuard";

/**
 * Blog layout wrapper with sticky header
 * Applies to all routes under /blogs/*
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-5 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Image src="/branding/logo.png" alt="Logo" width={30} height={30} />
            <h1 className="text-xl baskervville font-extrabold text-primary tracking-tight">
              Wryte.
            </h1>
          </div>

          <nav className="flex items-center space-x-4 text-sm relative">
            <Link
              href="/blogs"
              className="text-gray-600 hover:text-primary font-medium"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-primary font-medium"
            >
              About
            </Link>

            {/* User Dropdown - Only show when authenticated */}
            <AuthGuard showPrompt={false}>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <UserCircle className="w-6 h-6 text-primary" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <Link
                      href="/blogs/my-blogs"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 cursor-pointer"
                    >
                      <NotebookPen className="w-4 h-4 mr-2 text-primary" />
                      My Blogs
                    </Link>
                    <SignOutButton>
                      <button
                        onClick={() => {
                          console.log("Logging out...");
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-primary/10 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2 text-primary" />
                        Log Out
                      </button>
                    </SignOutButton>
                  </div>
                )}
              </div>
            </AuthGuard>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
