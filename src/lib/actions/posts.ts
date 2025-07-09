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
    const slug = slugify(title, { lower: true, strict: true });

    const newPost = await db
      .insert(posts)
      .values({
        title,
        slug,
        content,
        user_id: userId,
      })
      .returning({ id: posts.id });

    const postId = newPost[0]?.id;
    if (!postId) throw new Error("Failed to create post");

    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url) => ({
        post_id: postId,
        image_url: url,
      }));

      await db.insert(postImages).values(imagesToInsert);
    }

    revalidatePath("/blogs");

    return postId;
  } catch (error) {
    console.error("Error inserting post:", error);
    throw error;
  }
}

/**
 * Read: Get all posts with their images.
 */
export async function getAllPosts() {
  const postsData = await db.select().from(posts);
  return postsData;
}

/**
 * Read: Get a single post by ID.
 */
export async function getPostById(postId: number) {
  const post = await db.select().from(posts).where(eq(posts.id, postId));

  if (!post.length) throw new Error("Post not found");

  return post[0];
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
  const slug = slugify(updatedTitle, { lower: true, strict: true });

  const updateResult = await db
    .update(posts)
    .set({
      title: updatedTitle,
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

  return updateResult;
}

/**
 * Delete: Remove a post and its images.
 */
export async function deletePost(postId: number) {
  // Delete images first
  await db.delete(postImages).where(eq(postImages.post_id, postId));

  // Then delete the post
  const deleteResult = await db.delete(posts).where(eq(posts.id, postId));

  return deleteResult;
}
