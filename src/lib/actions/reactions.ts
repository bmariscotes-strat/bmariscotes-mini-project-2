"use server";

import { db } from "@/lib/db";
import { reactions, comments } from "@/lib/schema"; // Add comments import
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Toggles a user's reaction (upvote/downvote) on a target (post, comment, or reply)
 *
 * @param {number} userId - The ID of the user performing the action
 * @param {"post" | "comment" | "reply"} targetType - The type of content being reacted to
 * @param {number} targetId - The ID of the target content
 * @param {"upvote" | "downvote"} reactionType - The type of reaction to toggle
 * @param {number} [postId] - Optional post ID for better cache revalidation
 * @returns {Promise<Object|null>} The reaction object if created/updated, null if removed
 */
export async function toggleReaction(
  userId: number,
  targetType: "post" | "comment" | "reply",
  targetId: number,
  reactionType: "upvote" | "downvote",
  postId?: number // Optional postId for better revalidation
) {
  try {
    // First, check if the user already has a reaction on this specific target
    const existingReaction = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.user_id, userId),
          eq(reactions.target_type, targetType),
          eq(reactions.target_id, targetId)
        )
      )
      .limit(1);

    let result = null;

    if (existingReaction.length > 0) {
      const existing = existingReaction[0];

      if (existing.type === reactionType) {
        // User clicked the same reaction type they already have - remove it (toggle off)
        await db.delete(reactions).where(eq(reactions.id, existing.id));
        result = null; // Reaction removed
      } else {
        // User clicked a different reaction type - update the existing reaction
        // (e.g., changing from upvote to downvote or vice versa)
        const [updated] = await db
          .update(reactions)
          .set({ type: reactionType })
          .where(eq(reactions.id, existing.id))
          .returning();
        result = updated;
      }
    } else {
      // No existing reaction found - create a new one
      const [newReaction] = await db
        .insert(reactions)
        .values({
          type: reactionType,
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
        })
        .returning();
      result = newReaction;
    }

    // Revalidate cache for the specific post page if postId is provided
    // This ensures the UI updates immediately after the reaction change
    if (postId) {
      revalidatePath(`/posts/${postId}`);
    }

    // If the reaction is on a post itself, also revalidate the home page
    // This updates post listings that might show reaction counts
    if (targetType === "post") {
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Error toggling reaction:", error);
    throw new Error("Failed to toggle reaction");
  }
}

/**
 * Gets the total count of upvotes and downvotes for a specific target
 *
 * @param {"post" | "comment" | "reply"} targetType - The type of content
 * @param {number} targetId - The ID of the target content
 * @returns {Promise<{upvotes: number, downvotes: number}>} Object with upvote and downvote counts
 */
export async function getReactionCounts(
  targetType: "post" | "comment" | "reply",
  targetId: number
) {
  try {
    // Use SQL aggregation to count reactions by type in a single query
    const [result] = await db
      .select({
        // Count upvotes using conditional aggregation
        upvotes: sql<number>`COUNT(CASE WHEN type = 'upvote' THEN 1 END)`,
        // Count downvotes using conditional aggregation
        downvotes: sql<number>`COUNT(CASE WHEN type = 'downvote' THEN 1 END)`,
      })
      .from(reactions)
      .where(
        and(
          eq(reactions.target_type, targetType),
          eq(reactions.target_id, targetId)
        )
      );

    return {
      upvotes: Number(result.upvotes) || 0,
      downvotes: Number(result.downvotes) || 0,
    };
  } catch (error) {
    console.error("Error getting reaction counts:", error);
    // Return zero counts on error to prevent UI crashes
    return { upvotes: 0, downvotes: 0 };
  }
}

/**
 * Gets a specific user's reaction on a target, if any exists
 *
 * @param {number} userId - The ID of the user
 * @param {"post" | "comment" | "reply"} targetType - The type of content
 * @param {number} targetId - The ID of the target content
 * @returns {Promise<Object|null>} The user's reaction object or null if none exists
 */
export async function getUserReaction(
  userId: number,
  targetType: "post" | "comment" | "reply",
  targetId: number
) {
  try {
    // Look for the user's existing reaction on this specific target
    const [reaction] = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.user_id, userId),
          eq(reactions.target_type, targetType),
          eq(reactions.target_id, targetId)
        )
      )
      .limit(1);

    return reaction || null;
  } catch (error) {
    console.error("Error getting user reaction:", error);
    return null;
  }
}

/**
 * Gets comprehensive statistics for a post including reactions and comment count
 *
 * @param {number} postId - The ID of the post
 * @returns {Promise<{upvotes: number, downvotes: number, comments: number}>} Post statistics
 */
export async function getPostStats(postId: number) {
  try {
    // Get reaction counts for this post using conditional aggregation
    const [reactionCounts] = await db
      .select({
        upvotes: sql<number>`COUNT(CASE WHEN type = 'upvote' THEN 1 END)`,
        downvotes: sql<number>`COUNT(CASE WHEN type = 'downvote' THEN 1 END)`,
      })
      .from(reactions)
      .where(
        and(eq(reactions.target_type, "post"), eq(reactions.target_id, postId))
      );

    // Get total comment count for this post
    const [commentCount] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(comments)
      .where(eq(comments.post_id, postId));

    return {
      upvotes: Number(reactionCounts.upvotes) || 0,
      downvotes: Number(reactionCounts.downvotes) || 0,
      comments: Number(commentCount.count) || 0,
    };
  } catch (error) {
    console.error("Error getting post stats:", error);
    // Return zero stats on error to prevent UI crashes
    return { upvotes: 0, downvotes: 0, comments: 0 };
  }
}
