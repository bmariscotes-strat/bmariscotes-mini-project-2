"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import CommentForm from "@/components/ui/comments/CommentForm";
import ReactionButton from "@/components/ui/ReactionButton";
import ConfirmationModal from "@/components/widgets/ConfirmationModal";
import {
  updateComment,
  deleteComment,
  updateReply,
  deleteReply,
} from "@/lib/actions/comments";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useToastContext } from "@/providers/ToastProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface CommentProps {
  comment: {
    id: number;
    content: string;
    user_id: number;
    created_at: Date | null;
    updated_at?: Date | null;
    user_first_name?: string | null;
    user_last_name?: string | null;
  };
  replies?: {
    id: number;
    content: string;
    user_id: number;
    created_at: Date | null;
    updated_at?: Date | null;
    user_first_name?: string | null;
    user_last_name?: string | null;
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
}: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<number | null>(null);
  const [showCommentDropdown, setShowCommentDropdown] = useState(false);
  const [showReplyDropdown, setShowReplyDropdown] = useState<number | null>(
    null
  );
  const router = useRouter();

  const commentDropdownRef = useRef<HTMLDivElement>(null);
  const replyDropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToastContext();

  const isOwner = userId === comment.user_id;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commentDropdownRef.current &&
        !commentDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCommentDropdown(false);
      }
      if (
        replyDropdownRef.current &&
        !replyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowReplyDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditComment = () => {
    setIsEditing(true);
    setEditContent(comment.content);
    setShowCommentDropdown(false);
  };

  const handleUpdateComment = () => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      try {
        await updateComment(comment.id, editContent.trim(), userId!);
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        console.error("Error updating comment:", error);
        showToast("Failed to update comment", "error");
      }
    });
  };

  const handleDeleteComment = () => {
    setShowDeleteCommentModal(true);
    setShowCommentDropdown(false);
  };

  const confirmDeleteComment = () => {
    startTransition(async () => {
      try {
        await deleteComment(comment.id, userId!);
        setShowDeleteCommentModal(false);
        router.refresh();
      } catch (error) {
        console.error("Error deleting comment:", error);
        showToast("Failed to delete comment", "error");
        setShowDeleteCommentModal(false);
      }
    });
  };

  const handleEditReply = (replyId: number, content: string) => {
    setEditingReplyId(replyId);
    setEditingReplyContent(content);
    setShowReplyDropdown(null);
  };

  const handleUpdateReply = (replyId: number) => {
    if (!editingReplyContent.trim()) return;

    startTransition(async () => {
      try {
        await updateReply(replyId, editingReplyContent.trim(), userId!);
        setEditingReplyId(null);
        setEditingReplyContent("");
        router.refresh();
      } catch (error) {
        console.error("Error updating reply:", error);
        showToast("Failed to update reply", "error");
      }
    });
  };

  const handleDeleteReply = (replyId: number) => {
    setReplyToDelete(replyId);
    setShowDeleteReplyModal(true);
    setShowReplyDropdown(null);
  };

  const confirmDeleteReply = () => {
    if (!replyToDelete) return;

    startTransition(async () => {
      try {
        await deleteReply(replyToDelete, userId!);
        setShowDeleteReplyModal(false);
        setReplyToDelete(null);
        router.refresh();
      } catch (error) {
        console.error("Error deleting reply:", error);
        showToast("Failed to delete reply", "error");
        setShowDeleteReplyModal(false);
        setReplyToDelete(null);
      }
    });
  };

  const wasEdited =
    comment.updated_at &&
    comment.created_at &&
    comment.updated_at.getTime() !== comment.created_at.getTime();

  return (
    <>
      <div className="space-y-4">
        <div className="bg-gray-100/70 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {comment.user_first_name && comment.user_last_name
                  ? `${comment.user_first_name} ${comment.user_last_name}`
                  : "Anonymous"}
              </span>
              <span className="text-gray-500 text-sm">
                {comment.created_at &&
                  formatDistanceToNow(comment.created_at, { addSuffix: true })}
                {wasEdited && (
                  <span className="ml-1 text-gray-400">(edited)</span>
                )}
              </span>
            </div>

            {isOwner && (
              <div className="relative" ref={commentDropdownRef}>
                <button
                  onClick={() => setShowCommentDropdown(!showCommentDropdown)}
                  disabled={isPending}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1 rounded-full hover:bg-gray-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showCommentDropdown && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={handleEditComment}
                        disabled={isPending}
                        className="flex items-center w-full px-3 py-2 text-sm text-blue-400 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteComment}
                        disabled={isPending}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isPending}
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleUpdateComment}
                  disabled={isPending || !editContent.trim()}
                  className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 mb-3">{comment.content}</p>
          )}

          <AuthGuard showPrompt={false}>
            {!isEditing && (
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
            )}
          </AuthGuard>

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
            {replies.map((reply) => {
              const isReplyOwner = userId === reply.user_id;
              const isEditingThisReply = editingReplyId === reply.id;
              const replyWasEdited =
                reply.updated_at &&
                reply.created_at &&
                reply.updated_at.getTime() !== reply.created_at.getTime();

              return (
                <div
                  key={reply.id}
                  className="bg-gray-50 border-l-2 border-l-primary/50 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {reply.user_first_name && reply.user_last_name
                          ? `${reply.user_first_name} ${reply.user_last_name}`
                          : "Anonymous"}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {reply.created_at &&
                          formatDistanceToNow(reply.created_at, {
                            addSuffix: true,
                          })}
                        {replyWasEdited && (
                          <span className="ml-1 text-gray-400">(edited)</span>
                        )}
                      </span>
                    </div>

                    {isReplyOwner && (
                      <div className="relative" ref={replyDropdownRef}>
                        <button
                          onClick={() =>
                            setShowReplyDropdown(
                              showReplyDropdown === reply.id ? null : reply.id
                            )
                          }
                          disabled={isPending}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1 rounded-full hover:bg-gray-200"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {showReplyDropdown === reply.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() =>
                                  handleEditReply(reply.id, reply.content)
                                }
                                disabled={isPending}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                disabled={isPending}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditingThisReply ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingReplyContent}
                        onChange={(e) => setEditingReplyContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        disabled={isPending}
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateReply(reply.id)}
                          disabled={isPending || !editingReplyContent.trim()}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingReplyId(null);
                            setEditingReplyContent("");
                          }}
                          disabled={isPending}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700">{reply.content}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Comment Modal */}
      <ConfirmationModal
        isOpen={showDeleteCommentModal}
        onClose={() => setShowDeleteCommentModal(false)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone and will also delete all replies to this comment."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isPending}
      />

      {/* Delete Reply Modal */}
      <ConfirmationModal
        isOpen={showDeleteReplyModal}
        onClose={() => {
          setShowDeleteReplyModal(false);
          setReplyToDelete(null);
        }}
        onConfirm={confirmDeleteReply}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isPending}
      />
    </>
  );
}
