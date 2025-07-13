// components/ui/PostActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Trash2, MoreHorizontal } from "lucide-react";
import { deletePost } from "@/lib/actions/posts";
import { useToastContext } from "@/providers/ToastProvider";

interface PostActionsProps {
  postId: number;
  postSlug: string;
  postTitle: string;
}

export default function PostActions({
  postId,
  postSlug,
  postTitle,
}: PostActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToastContext();
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/blogs/${postSlug}/edit`);
    setShowDropdown(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(postId);

      // Redirect immediately to avoid 404
      router.push("/blogs");
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("Error deleting post. Please try again.", "error");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      {/* Actions Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Post actions"
        >
          <MoreHorizontal size={20} className="text-gray-600" />
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100   cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <Edit3 size={16} className="text-blue-400" />
                  Edit Post
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                  Delete Post
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Post
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <strong>&quot;{postTitle}&quot;</strong>? This action cannot be
                undone and will permanently remove the post and all its
                comments.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
