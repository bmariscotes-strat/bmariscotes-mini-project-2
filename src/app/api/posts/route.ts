import { NextResponse } from "next/server";
import { insertPostWithImages } from "@/lib/actions/posts";

export async function POST(req: Request) {
  try {
    const { title, content, userId, imageUrls } = await req.json();

    console.log("Received data:", { title, content, userId, imageUrls });

    const postId = await insertPostWithImages(
      title,
      content,
      userId,
      imageUrls
    );

    return NextResponse.json({ postId });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create post", details: errorMessage },
      { status: 500 }
    );
  }
}
