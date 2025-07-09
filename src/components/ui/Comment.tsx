"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import CommentForm from "./CommentForm";
import ReactionButton from "./ReactionButton";

interface CommentProps {
  comment: {
    id: number;
    content: string;
    user_id: number;
    created_at: Date | null;
  };
  replies?: {
    id: number;
    content: string;
    user_id: number;
    created_at: Date | null;
  }[];
  userId: number | null;
  reactionCounts: { upvotes: number; downvotes: number };
  userReaction: "upvote" | "downvote" | null;
  userName?: string;
}

export default function Comment({
  comment,
  replies = [],
  userId,
  reactionCounts,
  userReaction,
  userName = "Anonymous",
}: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{userName}</span>
            <span className="text-gray-500 text-sm">
              {comment.created_at &&
                formatDistanceToNow(comment.created_at, { addSuffix: true })}
            </span>
          </div>
        </div>

        <p className="text-gray-700 mb-3">{comment.content}</p>

        <div className="flex items-center justify-between">
          <ReactionButton
            targetType="comment"
            targetId={comment.id}
            userId={userId}
            initialUpvotes={reactionCounts.upvotes}
            initialDownvotes={reactionCounts.downvotes}
            userReaction={userReaction}
          />

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Reply
          </button>
        </div>

        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              commentId={comment.id}
              userId={userId}
              onSuccess={() => setShowReplyForm(false)}
              placeholder="Write a reply..."
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">Anonymous</span>
                <span className="text-gray-500 text-sm">
                  {reply.created_at &&
                    formatDistanceToNow(reply.created_at, { addSuffix: true })}
                </span>
              </div>
              <p className="text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
