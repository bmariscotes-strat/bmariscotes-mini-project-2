"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/lib/actions/reactions";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { useToastContext } from "@/providers/ToastProvider";

interface ReactionButtonProps {
  targetType: "post" | "comment" | "reply";
  targetId: number;
  userId: number | null;
  initialUpvotes: number;
  initialDownvotes: number;
  userReaction: "upvote" | "downvote" | null;
}

export default function ReactionButton({
  targetType,
  targetId,
  userId,
  initialUpvotes,
  initialDownvotes,
  userReaction,
}: ReactionButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentReaction, setCurrentReaction] = useState(userReaction);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToastContext();

  const handleReaction = (type: "upvote" | "downvote") => {
    if (!userId) {
      // Handle unauthenticated user
      alert("Please log in to react to posts");
      showToast("Please log in to react to posts", "info");
      return;
    }

    startTransition(async () => {
      try {
        await toggleReaction(userId, targetType, targetId, type);

        // Update local state based on the action
        if (currentReaction === type) {
          // Removing the reaction
          setCurrentReaction(null);
          if (type === "upvote") {
            setUpvotes((prev) => prev - 1);
          } else {
            setDownvotes((prev) => prev - 1);
          }
        } else if (currentReaction === null) {
          // Adding new reaction
          setCurrentReaction(type);
          if (type === "upvote") {
            setUpvotes((prev) => prev + 1);
          } else {
            setDownvotes((prev) => prev + 1);
          }
        } else {
          // Switching reaction type
          setCurrentReaction(type);
          if (type === "upvote") {
            setUpvotes((prev) => prev + 1);
            setDownvotes((prev) => prev - 1);
          } else {
            setUpvotes((prev) => prev - 1);
            setDownvotes((prev) => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error updating reaction:", error);
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleReaction("upvote")}
        disabled={isPending}
        className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
          currentReaction === "upvote"
            ? "bg-green-100 text-green-700 border border-green-300"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ChevronUpIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{upvotes}</span>
      </button>

      <button
        onClick={() => handleReaction("downvote")}
        disabled={isPending}
        className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
          currentReaction === "downvote"
            ? "bg-red-100 text-red-700 border border-red-300"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ChevronDownIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{downvotes}</span>
      </button>
    </div>
  );
}
