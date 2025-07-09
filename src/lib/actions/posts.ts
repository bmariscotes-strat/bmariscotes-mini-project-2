"use server";

import { db } from "@/lib/db";
import { posts, postImages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

/**
 * Create: Inserts a new post with multiple image URLs.
 */
export async function insertPostWithImages(
  title: string,
  content: string,
  userId: number,
  imageUrls: string[]
) {
  try {
    console.log("Attempting to create post with:", {
      title,
      userId,
      imageUrls,
    });

    // Create a unique slug - add timestamp to avoid duplicates
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    console.log("Generated slug:", slug);

    // Insert the post
    const newPost = await db
      .insert(posts)
      .values({
        title: title.trim(),
        slug,
        content,
        user_id: userId,
      })
      .returning({ id: posts.id });

    console.log("Post inserted:", newPost);

    const postId = newPost[0]?.id;
    if (!postId) {
      throw new Error("Failed to create post - no ID returned");
    }

    // Insert images if any
    if (imageUrls.length > 0) {
      console.log("Inserting images:", imageUrls);

      const imagesToInsert = imageUrls.map((url) => ({
        post_id: postId,
        image_url: url,
      }));

      await db.insert(postImages).values(imagesToInsert);
      console.log("Images inserted successfully");
    }

    revalidatePath("/blogs");
    console.log("Post created successfully with ID:", postId);

    return postId;
  } catch (error) {
    console.error("Detailed error inserting post:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        throw new Error(
          "A post with this title already exists. Please choose a different title."
        );
      }
      if (error.message.includes("violates not-null constraint")) {
        throw new Error(
          "Required fields are missing. Please check your input."
        );
      }
      if (error.message.includes("violates foreign key constraint")) {
        throw new Error("Invalid user ID provided.");
      }
    }

    throw new Error(
      `Failed to create post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Read: Get all posts with their images.
 */
export async function getAllPosts() {
  try {
    const postsData = await db.select().from(posts).orderBy(posts.created_at);
    return postsData;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw new Error("Failed to fetch posts");
  }
}

/**
 * Read: Get a single post by ID.
 */
export async function getPostById(postId: number) {
  try {
    const post = await db.select().from(posts).where(eq(posts.id, postId));

    if (!post.length) {
      throw new Error("Post not found");
    }

    return post[0];
  } catch (error) {
    console.error("Error fetching post:", error);
    throw new Error(
      `Failed to fetch post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Read: Get a single post by slug.
 */
export async function getPostBySlug(slug: string) {
  try {
    const post = await db.select().from(posts).where(eq(posts.slug, slug));

    if (!post.length) {
      return null;
    }

    return post[0];
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    throw new Error(
      `Failed to fetch post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Update: Update a post's title, content, and image URLs.
 */
export async function updatePost(
  postId: number,
  updatedTitle: string,
  updatedContent: string,
  imageUrls: string[]
) {
  try {
    const baseSlug = slugify(updatedTitle, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const updateResult = await db
      .update(posts)
      .set({
        title: updatedTitle.trim(),
        slug,
        content: updatedContent,
      })
      .where(eq(posts.id, postId));

    // Remove existing images first
    await db.delete(postImages).where(eq(postImages.post_id, postId));

    // Insert new images
    if (imageUrls.length > 0) {
      await db.insert(postImages).values(
        imageUrls.map((url) => ({
          post_id: postId,
          image_url: url,
        }))
      );
    }

    revalidatePath("/blogs");
    return updateResult;
  } catch (error) {
    console.error("Error updating post:", error);
    throw new Error(
      `Failed to update post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Delete: Remove a post and its images.
 */
export async function deletePost(postId: number) {
  try {
    // Delete images first
    await db.delete(postImages).where(eq(postImages.post_id, postId));

    // Then delete the post
    const deleteResult = await db.delete(posts).where(eq(posts.id, postId));

    revalidatePath("/blogs");
    return deleteResult;
  } catch (error) {
    console.error("Error deleting post:", error);
    throw new Error(
      `Failed to delete post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
