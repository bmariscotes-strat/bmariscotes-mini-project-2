"use client";

import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";
import { AuthPrompt } from "@/components/auth/AuthPrompt";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showPrompt?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  showPrompt = true,
}: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not signed in, show fallback or auth prompt
  if (!isSignedIn) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showPrompt) {
      return <AuthPrompt />;
    }

    return null;
  }

  // User is authenticated, show children
  return <>{children}</>;
}
