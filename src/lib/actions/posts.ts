"use server";

import { db } from "@/lib/db";
import { posts, postImages, comments, reactions, users } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

/**
 * Type definition for a post with author information
 */
interface PostWithAuthor {
  id: number;
  title: string;
  slug: string;
  content: string;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
  author: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

/**
 * CREATE: Inserts a new post with multiple image URLs
 *
 * This function handles the complete post creation process including:
 * - Generating a unique slug from the title
 * - Creating the post record
 * - Associating multiple images with the post
 * - Cache invalidation for updated content
 *
 * @param {string} title - The title of the post
 * @param {string} content - The main content/body of the post
 * @param {number} userId - The ID of the user creating the post
 * @param {string[]} imageUrls - Array of image URLs to associate with the post
 * @returns {Promise<number>} The ID of the newly created post
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

    // Generate a unique slug from the title
    // We add a timestamp to ensure uniqueness even for posts with identical titles
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    console.log("Generated slug:", slug);

    // Insert the main post record
    const newPost = await db
      .insert(posts)
      .values({
        title: title.trim(), // Remove any leading/trailing whitespace
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

    // Insert associated images if any were provided
    if (imageUrls.length > 0) {
      console.log("Inserting images:", imageUrls);

      // Create image records with display order for proper sequencing
      const imagesToInsert = imageUrls.map((url, index) => ({
        post_id: postId,
        image_url: url,
        display_order: index, // Maintain the order of images as provided
      }));

      await db.insert(postImages).values(imagesToInsert);
      console.log("Images inserted successfully");
    }

    // Invalidate the blogs page cache so new post appears immediately
    revalidatePath("/blogs");
    console.log("Post created successfully with ID:", postId);

    return postId;
  } catch (error) {
    console.error("Detailed error inserting post:", error);

    // Provide user-friendly error messages based on database constraint violations
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
 * READ: Get all posts with their author information
 *
 * Retrieves all posts from the database with a JOIN to include author details.
 * Posts are ordered by creation date (oldest first).
 *
 * @returns {Promise<PostWithAuthor[]>} Array of posts with author information
 */
export async function getAllPosts(): Promise<PostWithAuthor[]> {
  try {
    const postsData = await db
      .select({
        // Post fields
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        user_id: posts.user_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        // Author fields nested in an object
        author: {
          id: users.id,
          first_name: users.first_name,
          last_name: users.last_name,
          email: users.email,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.user_id, users.id)) // Join with users table to get author info
      .orderBy(posts.created_at); // Order by creation date

    return postsData;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw new Error("Failed to fetch posts");
  }
}

/**
 * READ: Get a single post by its numeric ID
 *
 * @param {number} postId - The numeric ID of the post to retrieve
 * @returns {Promise<Object>} The post object
 * @throws {Error} If post is not found or database error occurs
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
 * READ: Get a single post by its URL slug
 *
 * This function is used for SEO-friendly URLs and includes extensive logging
 * for debugging slug-related issues. Returns null instead of throwing errors
 * to prevent HTTP error fallbacks.
 *
 * @param {string} slug - The URL slug of the post to retrieve
 * @returns {Promise<Object|null>} The post object or null if not found
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

    // Return null instead of throwing to prevent NEXT_HTTP_ERROR_FALLBACK
    // This allows the calling code to handle the "not found" case gracefully
    return null;
  }
}

/**
 * READ: Get images associated with a specific post
 *
 * Currently limited to 1 image per post but can be easily modified
 * to return all images by removing the limit.
 *
 * @param {number} postId - The ID of the post to get images for
 * @returns {Promise<Array>} Array of image objects (currently max 1)
 */
export async function getPostImages(postId: number) {
  try {
    const images = await db
      .select()
      .from(postImages)
      .where(eq(postImages.post_id, postId))
      .limit(1); // Currently limiting to one image per post

    return images;
  } catch (error) {
    console.error("Error fetching post images:", error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}

/**
 * DEBUG: Search posts by slug pattern
 *
 * This is a debugging function that searches for posts matching a slug pattern.
 * It performs a full table scan and client-side filtering - not recommended
 * for production use with large datasets.
 *
 * @param {string} slugPattern - The pattern to search for in slugs and titles
 * @returns {Promise<Array>} Array of matching posts
 */
export async function searchPostsBySlug(slugPattern: string) {
  try {
    console.log("searchPostsBySlug - searching for pattern:", slugPattern);

    // Get all posts and filter by slug pattern
    // NOTE: This is inefficient for large datasets - consider using SQL LIKE queries
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
 * UPDATE: Update a post's title, content, and associated images
 *
 * This function updates the post content while preserving the original slug
 * (important for SEO and existing links). It completely replaces the image
 * associations with the new provided images.
 *
 * @param {number} postId - The ID of the post to update
 * @param {string} title - The new title for the post
 * @param {string} content - The new content for the post
 * @param {string[]} imageUrls - Array of new image URLs to associate with the post
 * @returns {Promise<{success: boolean}>} Success status object
 */
export async function updatePost(
  postId: number,
  title: string,
  content: string,
  imageUrls: string[]
) {
  try {
    // Update the post record - note that we keep the original slug
    // This is important for SEO and to prevent breaking existing links
    await db
      .update(posts)
      .set({
        title: title.trim(),
        content,
        updated_at: new Date(), // Track when the post was last modified
      })
      .where(eq(posts.id, postId));

    // Replace all existing images with the new ones
    // First, delete all existing post images
    await db.delete(postImages).where(eq(postImages.post_id, postId));

    // Then insert the new images if any were provided
    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url, index) => ({
        post_id: postId,
        image_url: url,
        display_order: index, // Maintain order of images
      }));

      await db.insert(postImages).values(imagesToInsert);
    }

    // Invalidate caches for both the post list and individual post pages
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
 * DELETE: Remove a post and all associated data
 *
 * This function performs a cascading delete to maintain referential integrity.
 * It removes all related data in the correct order to avoid foreign key violations:
 * 1. Reactions on the post and its comments
 * 2. Comments on the post
 * 3. Images associated with the post
 * 4. The post itself
 *
 * @param {number} postId - The ID of the post to delete
 * @returns {Promise<{success: boolean}>} Success status object
 */
export async function deletePost(postId: number) {
  try {
    // Step 1: Get all comment IDs for this post
    // We need these to delete reactions on comments before deleting the comments
    const postComments = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.post_id, postId));

    const commentIds = postComments.map((comment) => comment.id);

    // Step 2: Delete all reactions for this post
    await db
      .delete(reactions)
      .where(
        and(eq(reactions.target_type, "post"), eq(reactions.target_id, postId))
      );

    // Step 3: Delete all reactions for comments on this post
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

    // Step 4: Delete all comments on this post
    await db.delete(comments).where(eq(comments.post_id, postId));

    // Step 5: Delete all images associated with this post
    await db.delete(postImages).where(eq(postImages.post_id, postId));

    // Step 6: Finally, delete the post itself
    await db.delete(posts).where(eq(posts.id, postId));

    // Step 7: Invalidate the blogs page cache to update the post list
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
