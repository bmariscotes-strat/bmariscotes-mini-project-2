"use server";

import { db } from "@/lib/db";
import { comments, replies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCommentsByPostId(postId: number) {
  try {
    const postComments = await db
      .select()
      .from(comments)
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
      .select()
      .from(replies)
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

    // You might need to get the postId to revalidate the correct path
    // This assumes you have a way to get the post ID from the comment
    // revalidatePath(`/posts/${postId}`);

    // Alternative: revalidate the current path if you're on the post page
    revalidatePath("/posts/[id]", "page");

    return reply;
  } catch (error) {
    console.error("Error creating reply:", error);
    throw new Error("Failed to create reply");
  }
}
