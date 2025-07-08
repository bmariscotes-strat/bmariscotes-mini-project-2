"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import axios from "axios";
import {
  Bold,
  Italic,
  Heading2,
  List,
  Image as ImageIcon,
  Eraser,
} from "lucide-react";

export default function PostEditor() {
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { file: File; tempUrl: string }[]
  >([]); // Store images to upload later

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: "<p>Hello world!</p>",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a temporary URL for preview
    const tempUrl = URL.createObjectURL(file);

    // Add image to editor with temporary URL
    editor?.chain().focus().setImage({ src: tempUrl }).run();

    // Store the file and temp URL for later upload
    setPendingImages((prev) => [...prev, { file, tempUrl }]);
  };

  const uploadPendingImages = async () => {
    const uploadPromises = pendingImages.map(async ({ file, tempUrl }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "post_images");

      const { data } = await axios.post(
        "https://api.cloudinary.com/v1_1/dphcpekk1/image/upload",
        formData
      );

      return { tempUrl, cloudinaryUrl: data.secure_url };
    });

    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults;
  };

  const handleSubmit = async () => {
    if (!editor || !title) return;

    setUploading(true);

    try {
      let content = editor.getHTML();

      // Only upload images if there are pending images
      if (pendingImages.length > 0) {
        // Upload all pending images first
        const uploadResults = await uploadPendingImages();

        // Replace temporary URLs with Cloudinary URLs in the editor content
        uploadResults.forEach(({ tempUrl, cloudinaryUrl }) => {
          content = content.replace(tempUrl, cloudinaryUrl);
        });
      }

      // Extract image URLs from content
      const imageUrls: string[] = [];
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1];
        // Only include Cloudinary URLs, not temporary blob URLs
        if (src.includes("cloudinary.com")) {
          imageUrls.push(src);
        }
      }

      // Submit the post with updated image URLs
      await axios.post("/api/posts", {
        title,
        content,
        userId: 1, // TODO: Replace with actual user ID from auth
        imageUrls,
      });

      alert("Post created!");

      // Clean up
      setTitle("");
      editor.commands.setContent("<p></p>");

      // Revoke temporary URLs to free memory
      pendingImages.forEach(({ tempUrl }) => {
        URL.revokeObjectURL(tempUrl);
      });
      setPendingImages([]);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="border p-2 w-full rounded"
      />

      {editor && (
        <div className="flex items-center gap-2 flex-wrap border p-2 rounded bg-gray-50">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive("bold") ? "bg-black text-white" : ""
            }`}
          >
            <Bold size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive("italic") ? "bg-black text-white" : ""
            }`}
          >
            <Italic size={16} />
          </button>

          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive("heading", { level: 2 })
                ? "bg-black text-white"
                : ""
            }`}
          >
            <Heading2 size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive("bulletList") ? "bg-black text-white" : ""
            }`}
          >
            <List size={16} />
          </button>

          <label className="p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1">
            <ImageIcon size={16} />
            <input
              type="file"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>

          <button
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            className="p-2 rounded hover:bg-gray-200"
          >
            <Eraser size={16} />
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="border p-3 rounded min-h-[200px] bg-white"
      />

      {pendingImages.length > 0 && (
        <div className="text-sm text-gray-600">
          {pendingImages.length} image(s) ready to upload
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-black text-white px-4 py-2 rounded"
        disabled={uploading}
      >
        {uploading ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
