"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { MessageCircle, Heart, Share2, User } from "lucide-react";

interface AuthPromptProps {
  action?: string;
  className?: string;
}

export function AuthPrompt({
  action = "comment",
  className = "",
}: AuthPromptProps) {
  const getIcon = () => {
    switch (action) {
      case "comment":
        return <MessageCircle className="h-5 w-5" />;
      case "like":
        return <Heart className="h-5 w-5" />;
      case "share":
        return <Share2 className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getActionText = () => {
    switch (action) {
      case "comment":
        return "to comment";
      case "like":
        return "to like posts";
      case "share":
        return "to share posts";
      default:
        return "to continue";
    }
  };

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}
    >
      <div className="flex items-center justify-center mb-4">
        <div className="bg-blue-100 rounded-full p-3">{getIcon()}</div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Join the conversation!
      </h3>

      <p className="text-gray-600 mb-4">
        Sign up {getActionText()} and connect with the community.
      </p>

      <div className="flex gap-3 justify-center">
        <SignUpButton mode="modal">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Sign Up
          </button>
        </SignUpButton>

        <SignInButton mode="modal">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Free to join • No spam • Secure with Clerk
      </p>
    </div>
  );
}

// Alternative compact version for inline use
export function AuthPromptCompact({
  action = "comment",
  className = "",
}: AuthPromptProps) {
  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 text-center ${className}`}
    >
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-medium">Sign in to {action}</span> and join the
        discussion
      </p>

      <div className="flex gap-2 justify-center">
        <SignUpButton mode="modal">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Sign Up
          </button>
        </SignUpButton>

        <SignInButton mode="modal">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
