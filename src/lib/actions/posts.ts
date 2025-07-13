"use server";

import { db } from "@/lib/db";
import { posts, postImages, comments, reactions, users } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

interface PostWithAuthor {
  id: number;
  title: string;
  slug: string;
  content: string;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
  author: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

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

      const imagesToInsert = imageUrls.map((url, index) => ({
        post_id: postId,
        image_url: url,
        display_order: index,
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
export async function getAllPosts(): Promise<PostWithAuthor[]> {
  try {
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        user_id: posts.user_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        author: {
          first_name: users.first_name,
          last_name: users.last_name,
          email: users.email,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.user_id, users.id))
      .orderBy(posts.created_at);

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
    console.log("getPostBySlug - searching for slug:", slug);
    console.log("getPostBySlug - slug type:", typeof slug);
    console.log("getPostBySlug - slug length:", slug.length);

    const post = await db.select().from(posts).where(eq(posts.slug, slug));

    console.log("getPostBySlug - query executed successfully");
    console.log("getPostBySlug - raw result:", post);
    console.log("getPostBySlug - result length:", post.length);

    if (!post || post.length === 0) {
      console.log("getPostBySlug - no post found, returning null");
      return null;
    }

    console.log("getPostBySlug - returning post:", post[0]);
    return post[0];
  } catch (error) {
    console.error("getPostBySlug - Database error:", error);
    console.error("getPostBySlug - Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      slug,
      errorType: typeof error,
    });

    // Don't throw here - return null to indicate not found
    // This prevents the NEXT_HTTP_ERROR_FALLBACK error
    return null;
  }
}

/**
 * Debug: Search posts by slug pattern
 */
export async function searchPostsBySlug(slugPattern: string) {
  try {
    console.log("searchPostsBySlug - searching for pattern:", slugPattern);

    // Get all posts and filter by slug pattern
    const allPosts = await db.select().from(posts);
    const matchingPosts = allPosts.filter(
      (post) =>
        post.slug.includes(slugPattern) ||
        post.title.toLowerCase().includes(slugPattern.toLowerCase())
    );

    console.log("searchPostsBySlug - found posts:", matchingPosts.length);
    return matchingPosts;
  } catch (error) {
    console.error("searchPostsBySlug - Database error:", error);
    return [];
  }
}

/**
 * Update: Update a post's title, content, and image URLs.
 */
export async function updatePost(
  postId: number,
  title: string,
  content: string,
  imageUrls: string[]
) {
  try {
    // Update the post - keep the original slug
    await db
      .update(posts)
      .set({
        title: title.trim(),
        content,
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId));

    // Delete existing post images
    await db.delete(postImages).where(eq(postImages.post_id, postId));

    // Insert new images if any
    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url, index) => ({
        post_id: postId,
        image_url: url,
        display_order: index,
      }));

      await db.insert(postImages).values(imagesToInsert);
    }

    // Revalidate relevant pages
    revalidatePath("/blogs");
    revalidatePath(`/blogs/[slug]`, "page");

    return { success: true };
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
 * Delete: Remove a post and all associated data.
 */
export async function deletePost(postId: number) {
  try {
    // First, get all comment IDs for this post to delete their reactions
    const postComments = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.post_id, postId));

    const commentIds = postComments.map((comment) => comment.id);

    // Delete all reactions for this post
    await db
      .delete(reactions)
      .where(
        and(eq(reactions.target_type, "post"), eq(reactions.target_id, postId))
      );

    // Delete all reactions for comments on this post
    if (commentIds.length > 0) {
      await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.target_type, "comment"),
            inArray(reactions.target_id, commentIds)
          )
        );
    }

    // Delete all comments on this post
    await db.delete(comments).where(eq(comments.post_id, postId));

    // Delete all post images
    await db.delete(postImages).where(eq(postImages.post_id, postId));

    // Finally, delete the post itself
    await db.delete(posts).where(eq(posts.id, postId));

    // Revalidate the blogs page to update the post list
    revalidatePath("/blogs");

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    throw new Error(
      `Failed to delete post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
