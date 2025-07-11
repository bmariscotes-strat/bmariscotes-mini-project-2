// components/ui/EditPostForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Image as ImageIcon,
  Eraser,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import NextImage from "next/image";
import { updatePost } from "@/lib/actions/posts";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "next/link";

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
}

interface EditPostFormProps {
  post: Post;
}

export default function EditPostForm({ post }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { file: File; tempUrl: string; id: string }[]
  >([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({ message: "", type: "success", show: false });

  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "bullet-list",
          },
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg shadow-sm",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your post...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ],
    content: post.content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none",
      },
    },
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const tempUrl = URL.createObjectURL(file);
      const id = generateId();

      // Add image to editor
      editor?.chain().focus().setImage({ src: tempUrl, alt: file.name }).run();

      // Add to pending images
      setPendingImages((prev) => [...prev, { file, tempUrl, id }]);
    });

    // Clear the input
    e.target.value = "";
  };

  const removeImage = (imageToRemove: {
    file: File;
    tempUrl: string;
    id: string;
  }) => {
    // Remove from editor content
    const currentContent = editor?.getHTML() || "";
    const updatedContent = currentContent.replace(
      new RegExp(
        `<img[^>]*src="${imageToRemove.tempUrl.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}"[^>]*>`,
        "g"
      ),
      ""
    );
    editor?.commands.setContent(updatedContent);

    // Remove from pending images
    setPendingImages((prev) =>
      prev.filter((img) => img.id !== imageToRemove.id)
    );

    // Revoke object URL
    URL.revokeObjectURL(imageToRemove.tempUrl);
  };

  const uploadPendingImages = async () => {
    if (pendingImages.length === 0) return [];

    const uploadPromises = pendingImages.map(async ({ file, tempUrl }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "post_images");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dphcpekk1/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      return { tempUrl, cloudinaryUrl: data.secure_url };
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (!editor || !title.trim()) {
      showToast("Please enter a title for your post", "error");
      return;
    }

    setIsUpdating(true);

    try {
      let content = editor.getHTML();

      // Upload any new images
      const uploadResults = await uploadPendingImages();

      // Replace temporary URLs with Cloudinary URLs
      uploadResults.forEach(({ tempUrl, cloudinaryUrl }) => {
        content = content.replace(tempUrl, cloudinaryUrl);
      });

      // Extract all image URLs from content
      const imageUrls: string[] = [];
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1];
        if (src.includes("cloudinary.com")) {
          imageUrls.push(src);
        }
      }

      // Update the post
      await updatePost(post.id, title, content, imageUrls);

      showToast("Post updated successfully!", "success");

      // Clean up pending images
      pendingImages.forEach(({ tempUrl }) => URL.revokeObjectURL(tempUrl));
      setPendingImages([]);

      // Redirect to the post page after a short delay
      setTimeout(() => {
        router.push(`/blogs/${post.slug}`);
      }, 1500);
    } catch (error) {
      console.error("Error updating post:", error);
      showToast("Error updating post. Please try again.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl class mx-auto px-4 pb-8 pt-10">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border transform transition-all duration-300 ease-in-out ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <AlertCircle size={20} className="text-red-500" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className=" px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Edit Blog</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Post Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your post title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-lg"
            />
          </div>

          {/* Toolbar */}
          {editor && (
            <div className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-lg border border-gray-200">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                  editor.isActive("bold")
                    ? "bg-primary text-white hover:bg-blue-600"
                    : ""
                }`}
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                  editor.isActive("italic")
                    ? "bg-primary text-white hover:bg-blue-600"
                    : ""
                }`}
                title="Italic"
              >
                <Italic size={18} />
              </button>

              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-primary text-white hover:bg-blue-600"
                    : ""
                }`}
                title="Heading 2"
              >
                <Heading2 size={18} />
              </button>

              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-primary text-white hover:bg-blue-600"
                    : ""
                }`}
                title="Heading 3"
              >
                <Heading3 size={18} />
              </button>

              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 4 }).run()
                }
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                  editor.isActive("heading", { level: 4 })
                    ? "bg-primary text-white hover:bg-blue-600"
                    : ""
                }`}
                title="Heading 4"
              >
                <span className="text-sm font-semibold">H4</span>
              </button>

              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
                  editor.isActive("bulletList")
                    ? "bg-primary text-white hover:bg-blue-600"
                    : ""
                }`}
                title="Bullet List"
              >
                <List size={18} />
              </button>

              <label className="p-2 rounded-md hover:bg-gray-200 cursor-pointer flex items-center gap-1 transition-colors text-gray-700 hover:text-gray-900">
                <ImageIcon size={18} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              <button
                onClick={() =>
                  editor.chain().focus().unsetAllMarks().clearNodes().run()
                }
                className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900"
                title="Clear formatting"
              >
                <Eraser size={18} />
              </button>
            </div>
          )}

          {/* Editor Content */}
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <EditorContent
              editor={editor}
              className="min-h-[300px] p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
            />
          </div>

          {/* Pending Images Preview */}
          {pendingImages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload size={16} />
                New images to upload ({pendingImages.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {pendingImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                  >
                    <NextImage
                      src={image.tempUrl}
                      alt={image.file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    <button
                      onClick={() => removeImage(image)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                      {image.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href={`/blogs/${post.slug}`}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isUpdating || !title.trim()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                "Update Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
