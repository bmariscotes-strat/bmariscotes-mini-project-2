"use server";

import { db } from "@/lib/db";
import { comments, replies, users, reactions } from "@/lib/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ===== READ OPERATIONS =====

/**
 * READ: Get all comments for a specific post with author information
 *
 * Retrieves comments in descending order (newest first) with user details
 * joined from the users table. Uses LEFT JOIN to handle cases where
 * user data might be missing.
 *
 * @param {number} postId - The ID of the post to get comments for
 * @returns {Promise<Array>} Array of comment objects with user information
 * @throws {Error} If database query fails
 */
export async function getCommentsByPostId(postId: number) {
  try {
    const postComments = await db
      .select({
        // Comment fields
        id: comments.id,
        content: comments.content,
        user_id: comments.user_id,
        post_id: comments.post_id,
        created_at: comments.created_at,
        updated_at: comments.updated_at,
        // Author fields (using snake_case for consistency with database schema)
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(comments)
      .leftJoin(users, eq(comments.user_id, users.id)) // LEFT JOIN handles missing user data gracefully
      .where(eq(comments.post_id, postId))
      .orderBy(desc(comments.created_at)); // Newest comments first

    return postComments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw new Error("Failed to fetch comments");
  }
}

/**
 * READ: Get all replies for a specific comment with author information
 *
 * Similar to getCommentsByPostId but for replies to comments.
 * Maintains the same ordering and joining pattern for consistency.
 *
 * @param {number} commentId - The ID of the comment to get replies for
 * @returns {Promise<Array>} Array of reply objects with user information
 * @throws {Error} If database query fails
 */
export async function getRepliesByCommentId(commentId: number) {
  try {
    const commentReplies = await db
      .select({
        // Reply fields
        id: replies.id,
        content: replies.content,
        user_id: replies.user_id,
        comment_id: replies.comment_id,
        created_at: replies.created_at,
        updated_at: replies.updated_at,
        // Author fields (consistent naming with comments)
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(replies)
      .leftJoin(users, eq(replies.user_id, users.id)) // LEFT JOIN for missing user data
      .where(eq(replies.comment_id, commentId))
      .orderBy(desc(replies.created_at)); // Newest replies first

    return commentReplies;
  } catch (error) {
    console.error("Error fetching replies:", error);
    throw new Error("Failed to fetch replies");
  }
}

// ===== CREATE OPERATIONS =====

/**
 * CREATE: Add a new comment to a post
 *
 * Creates a new comment and invalidates relevant cache paths to ensure
 * the UI updates immediately. Revalidates both the specific post page
 * and the home page (in case it shows comment counts).
 *
 * @param {number} postId - The ID of the post to comment on
 * @param {string} content - The comment content
 * @param {number} userId - The ID of the user creating the comment
 * @returns {Promise<Object>} The created comment object
 * @throws {Error} If comment creation fails
 */
export async function createComment(
  postId: number,
  content: string,
  userId: number
) {
  try {
    const [comment] = await db
      .insert(comments)
      .values({
        content,
        user_id: userId,
        post_id: postId,
      })
      .returning(); // Return the created comment for immediate use

    // Invalidate caches to show new comment immediately
    revalidatePath(`/posts/${postId}`); // Specific post page
    revalidatePath("/"); // Home page (may show comment counts)

    return comment;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw new Error("Failed to create comment");
  }
}

/**
 * CREATE: Add a new reply to a comment
 *
 * Creates a reply to an existing comment. Uses a more generic path
 * revalidation that covers all post pages since we don't have the
 * specific post ID readily available.
 *
 * @param {number} commentId - The ID of the comment to reply to
 * @param {string} content - The reply content
 * @param {number} userId - The ID of the user creating the reply
 * @returns {Promise<Object>} The created reply object
 * @throws {Error} If reply creation fails
 */
export async function createReply(
  commentId: number,
  content: string,
  userId: number
) {
  try {
    const [reply] = await db
      .insert(replies)
      .values({
        content,
        user_id: userId,
        comment_id: commentId,
      })
      .returning(); // Return the created reply for immediate use

    // Revalidate all post pages since we don't have the specific postId here
    revalidatePath("/posts/[id]", "page");

    return reply;
  } catch (error) {
    console.error("Error creating reply:", error);
    throw new Error("Failed to create reply");
  }
}

// ===== UPDATE OPERATIONS =====

/**
 * UPDATE: Modify an existing comment
 *
 * Updates a comment's content with proper authorization checks.
 * Only the original author can edit their comment. Updates the
 * updated_at timestamp to track modifications.
 *
 * @param {number} commentId - The ID of the comment to update
 * @param {string} content - The new content for the comment
 * @param {number} userId - The ID of the user attempting the update
 * @returns {Promise<Object>} The updated comment object
 * @throws {Error} If comment not found, unauthorized, or update fails
 */
export async function updateComment(
  commentId: number,
  content: string,
  userId: number
) {
  try {
    // First, verify the comment exists and get ownership info
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existingComment.length) {
      throw new Error("Comment not found");
    }

    // Authorization check: only the author can edit their comment
    if (existingComment[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only edit your own comments");
    }

    // Perform the update with a new timestamp
    const [updatedComment] = await db
      .update(comments)
      .set({
        content,
        updated_at: new Date(), // Track when the comment was last modified
      })
      .where(eq(comments.id, commentId))
      .returning();

    // Invalidate caches to show the updated comment
    revalidatePath(`/posts/${existingComment[0].post_id}`);
    revalidatePath("/");

    return updatedComment;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw new Error("Failed to update comment");
  }
}

/**
 * UPDATE: Modify an existing reply
 *
 * Similar to updateComment but for replies. Includes the same
 * authorization checks and timestamp updates.
 *
 * @param {number} replyId - The ID of the reply to update
 * @param {string} content - The new content for the reply
 * @param {number} userId - The ID of the user attempting the update
 * @returns {Promise<Object>} The updated reply object
 * @throws {Error} If reply not found, unauthorized, or update fails
 */
export async function updateReply(
  replyId: number,
  content: string,
  userId: number
) {
  try {
    // Verify the reply exists and get ownership info
    const existingReply = await db
      .select()
      .from(replies)
      .where(eq(replies.id, replyId))
      .limit(1);

    if (!existingReply.length) {
      throw new Error("Reply not found");
    }

    // Authorization check: only the author can edit their reply
    if (existingReply[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only edit your own replies");
    }

    // Perform the update with a new timestamp
    const [updatedReply] = await db
      .update(replies)
      .set({
        content,
        updated_at: new Date(), // Track when the reply was last modified
      })
      .where(eq(replies.id, replyId))
      .returning();

    // Invalidate cache for post pages
    revalidatePath("/posts/[id]", "page");

    return updatedReply;
  } catch (error) {
    console.error("Error updating reply:", error);
    throw new Error("Failed to update reply");
  }
}

// ===== DELETE OPERATIONS =====

/**
 * DELETE: Remove a comment and all associated data
 *
 * This function performs a cascading delete to maintain referential integrity.
 * It removes data in the correct order to avoid foreign key violations:
 * 1. Reactions on all replies to this comment
 * 2. Reactions on the comment itself
 * 3. All replies to this comment
 * 4. The comment itself
 *
 * Includes authorization checks to ensure only the comment author can delete it.
 *
 * @param {number} commentId - The ID of the comment to delete
 * @param {number} userId - The ID of the user attempting the deletion
 * @returns {Promise<{success: boolean}>} Success status object
 * @throws {Error} If unauthorized or deletion fails
 */
export async function deleteComment(commentId: number, userId: number) {
  try {
    // First, verify the comment exists and check ownership
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment.length || comment[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own comments");
    }

    // Step 1: Get all reply IDs for this comment
    // We need these to delete reactions on replies before deleting the replies
    const replyIds = await db
      .select({ id: replies.id })
      .from(replies)
      .where(eq(replies.comment_id, commentId));

    // Step 2: Delete reactions on all replies to this comment
    if (replyIds.length > 0) {
      await db.delete(reactions).where(
        and(
          eq(reactions.target_type, "reply"),
          inArray(
            reactions.target_id,
            replyIds.map((r) => r.id)
          )
        )
      );
    }

    // Step 3: Delete reactions on the comment itself
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.target_type, "comment"),
          eq(reactions.target_id, commentId)
        )
      );

    // Step 4: Delete all replies to this comment
    await db.delete(replies).where(eq(replies.comment_id, commentId));

    // Step 5: Finally, delete the comment itself
    await db.delete(comments).where(eq(comments.id, commentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error; // Re-throw to preserve the original error type and message
  }
}

/**
 * DELETE: Remove a reply
 *
 * Simpler than comment deletion since replies don't have nested replies.
 * Still includes proper authorization checks to ensure only the reply
 * author can delete it.
 *
 * @param {number} replyId - The ID of the reply to delete
 * @param {number} userId - The ID of the user attempting the deletion
 * @returns {Promise<{success: boolean}>} Success status object
 * @throws {Error} If reply not found, unauthorized, or deletion fails
 */
export async function deleteReply(replyId: number, userId: number) {
  try {
    // Verify the reply exists and check ownership
    const existingReply = await db
      .select()
      .from(replies)
      .where(eq(replies.id, replyId))
      .limit(1);

    if (!existingReply.length) {
      throw new Error("Reply not found");
    }

    // Authorization check: only the author can delete their reply
    if (existingReply[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own replies");
    }

    // Delete the reply (reactions should be handled by database cascading or separate cleanup)
    await db.delete(replies).where(eq(replies.id, replyId));

    // Invalidate cache for post pages
    revalidatePath("/posts/[id]", "page");

    return { success: true };
  } catch (error) {
    console.error("Error deleting reply:", error);
    throw new Error("Failed to delete reply");
  }
}
