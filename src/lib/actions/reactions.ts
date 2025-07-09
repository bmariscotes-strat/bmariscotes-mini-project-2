"use server";

import { db } from "@/lib/db";
import { reactions, comments } from "@/lib/schema"; // Add comments import
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleReaction(
  userId: number,
  targetType: "post" | "comment" | "reply",
  targetId: number,
  reactionType: "upvote" | "downvote",
  postId?: number // Optional postId for better revalidation
) {
  try {
    // Check if user already has a reaction on this target
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
        // Same reaction type - remove it
        await db.delete(reactions).where(eq(reactions.id, existing.id));
        result = null;
      } else {
        // Different reaction type - update it
        const [updated] = await db
          .update(reactions)
          .set({ type: reactionType })
          .where(eq(reactions.id, existing.id))
          .returning();
        result = updated;
      }
    } else {
      // No existing reaction - create new one
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

    // Revalidate relevant paths
    if (postId) {
      revalidatePath(`/posts/${postId}`);
    }

    // Revalidate home page if this affects post listings
    if (targetType === "post") {
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Error toggling reaction:", error);
    throw new Error("Failed to toggle reaction");
  }
}

export async function getReactionCounts(
  targetType: "post" | "comment" | "reply",
  targetId: number
) {
  try {
    const [result] = await db
      .select({
        upvotes: sql<number>`COUNT(CASE WHEN type = 'upvote' THEN 1 END)`,
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
    return { upvotes: 0, downvotes: 0 };
  }
}

export async function getUserReaction(
  userId: number,
  targetType: "post" | "comment" | "reply",
  targetId: number
) {
  try {
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

export async function getPostStats(postId: number) {
  try {
    const [reactionCounts] = await db
      .select({
        upvotes: sql<number>`COUNT(CASE WHEN type = 'upvote' THEN 1 END)`,
        downvotes: sql<number>`COUNT(CASE WHEN type = 'downvote' THEN 1 END)`,
      })
      .from(reactions)
      .where(
        and(eq(reactions.target_type, "post"), eq(reactions.target_id, postId))
      );

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
    return { upvotes: 0, downvotes: 0, comments: 0 };
  }
}
