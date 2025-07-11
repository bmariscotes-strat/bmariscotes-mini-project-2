"use server";

import { db } from "@/lib/db";
import { comments, replies, users, reactions } from "@/lib/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCommentsByPostId(postId: number) {
  try {
    const postComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        user_id: comments.user_id,
        post_id: comments.post_id,
        created_at: comments.created_at,
        updated_at: comments.updated_at,
        // Keep snake_case consistent
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(comments)
      .leftJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.post_id, postId))
      .orderBy(desc(comments.created_at));

    return postComments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw new Error("Failed to fetch comments");
  }
}

export async function getRepliesByCommentId(commentId: number) {
  try {
    const commentReplies = await db
      .select({
        id: replies.id,
        content: replies.content,
        user_id: replies.user_id,
        comment_id: replies.comment_id,
        created_at: replies.created_at,
        updated_at: replies.updated_at,
        // Keep snake_case consistent
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(replies)
      .leftJoin(users, eq(replies.user_id, users.id))
      .where(eq(replies.comment_id, commentId))
      .orderBy(desc(replies.created_at));

    return commentReplies;
  } catch (error) {
    console.error("Error fetching replies:", error);
    throw new Error("Failed to fetch replies");
  }
}

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
      .returning();

    // Revalidate the post page to show the new comment
    revalidatePath(`/posts/${postId}`);
    // Also revalidate any listings that might show comment counts
    revalidatePath("/");

    return comment;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw new Error("Failed to create comment");
  }
}

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
      .returning();

    revalidatePath("/posts/[id]", "page");

    return reply;
  } catch (error) {
    console.error("Error creating reply:", error);
    throw new Error("Failed to create reply");
  }
}

export async function updateComment(
  commentId: number,
  content: string,
  userId: number
) {
  try {
    // First verify the user owns the comment
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existingComment.length) {
      throw new Error("Comment not found");
    }

    if (existingComment[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only edit your own comments");
    }

    const [updatedComment] = await db
      .update(comments)
      .set({
        content,
        updated_at: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    // Revalidate the post page
    revalidatePath(`/posts/${existingComment[0].post_id}`);
    revalidatePath("/");

    return updatedComment;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw new Error("Failed to update comment");
  }
}

export async function deleteComment(commentId: number, userId: number) {
  try {
    // First, verify the user owns the comment
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment.length || comment[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own comments");
    }

    // Get all reply IDs for this comment (for deleting their reactions)
    const replyIds = await db
      .select({ id: replies.id })
      .from(replies)
      .where(eq(replies.comment_id, commentId));

    // 1. Delete reactions on all replies to this comment
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

    // 2. Delete reactions on the comment itself
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.target_type, "comment"),
          eq(reactions.target_id, commentId)
        )
      );

    // 3. Delete all replies to this comment (cascade will handle this if you have it set up)
    await db.delete(replies).where(eq(replies.comment_id, commentId));

    // 4. Finally, delete the comment
    await db.delete(comments).where(eq(comments.id, commentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

export async function updateReply(
  replyId: number,
  content: string,
  userId: number
) {
  try {
    // First verify the user owns the reply
    const existingReply = await db
      .select()
      .from(replies)
      .where(eq(replies.id, replyId))
      .limit(1);

    if (!existingReply.length) {
      throw new Error("Reply not found");
    }

    if (existingReply[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only edit your own replies");
    }

    const [updatedReply] = await db
      .update(replies)
      .set({
        content,
        updated_at: new Date(),
      })
      .where(eq(replies.id, replyId))
      .returning();

    revalidatePath("/posts/[id]", "page");

    return updatedReply;
  } catch (error) {
    console.error("Error updating reply:", error);
    throw new Error("Failed to update reply");
  }
}

export async function deleteReply(replyId: number, userId: number) {
  try {
    // First verify the user owns the reply
    const existingReply = await db
      .select()
      .from(replies)
      .where(eq(replies.id, replyId))
      .limit(1);

    if (!existingReply.length) {
      throw new Error("Reply not found");
    }

    if (existingReply[0].user_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own replies");
    }

    // Delete the reply
    await db.delete(replies).where(eq(replies.id, replyId));

    revalidatePath("/posts/[id]", "page");

    return { success: true };
  } catch (error) {
    console.error("Error deleting reply:", error);
    throw new Error("Failed to delete reply");
  }
}
