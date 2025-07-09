"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Heading2,
  List,
  Image as ImageIcon,
  Eraser,
} from "lucide-react";
import { insertPostWithImages } from "@/lib/actions/posts";

export default function PostEditor() {
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { file: File; tempUrl: string }[]
  >([]);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: "<p>Hello world!</p>",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempUrl = URL.createObjectURL(file);
    editor?.chain().focus().setImage({ src: tempUrl }).run();
    setPendingImages((prev) => [...prev, { file, tempUrl }]);
  };

  const uploadPendingImages = async () => {
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
    if (!editor || !title) return;

    setUploading(true);

    try {
      let content = editor.getHTML();

      const uploadResults = await uploadPendingImages();

      uploadResults.forEach(({ tempUrl, cloudinaryUrl }) => {
        content = content.replace(tempUrl, cloudinaryUrl);
      });

      const imageUrls: string[] = [];
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1];
        if (src.includes("cloudinary.com")) {
          imageUrls.push(src);
        }
      }

      // Server Action call
      await insertPostWithImages(
        title,
        content,
        1, // replace with actual user ID later
        imageUrls
      );

      alert("Post created!");

      setTitle("");
      editor.commands.setContent("<p></p>");
      pendingImages.forEach(({ tempUrl }) => URL.revokeObjectURL(tempUrl));
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
