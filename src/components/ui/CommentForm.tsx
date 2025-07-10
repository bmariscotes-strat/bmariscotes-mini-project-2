"use client";

import { useState, useTransition } from "react";
import { createComment, createReply } from "@/lib/actions/comments";
import { useRouter } from "next/navigation";

interface CommentFormProps {
  postId?: number;
  commentId?: number;
  userId: number | null;
  onSuccess?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  postId,
  commentId,
  userId,
  onSuccess,
  placeholder = "Write a comment...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("Please log in to comment");
      return;
    }

    if (!content.trim()) return;

    startTransition(async () => {
      try {
        if (postId) {
          await createComment(postId, content.trim(), userId);
        } else if (commentId) {
          await createReply(commentId, content.trim(), userId);
        }

        setContent("");
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error("Error creating comment:", error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={3}
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="btn-small bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Posting..." : postId ? "Post Comment" : "Post Reply"}
      </button>
    </form>
  );
}
