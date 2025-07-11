// app/blogs/[slug]/page.tsx
import { getPostBySlug } from "@/lib/actions/posts";
import {
  getCommentsByPostId,
  getRepliesByCommentId,
} from "@/lib/actions/comments";
import { getReactionCounts, getUserReaction } from "@/lib/actions/reactions";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactionButton from "@/components/ui/ReactionButton";
import CommentForm from "@/components/ui/CommentForm";
import Comment from "@/components/ui/Comment";
import PostActions from "@/components/ui/PostActions";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound();
    }

    // Get comments and reactions
    const comments = await getCommentsByPostId(post.id);
    const postReactionCounts = await getReactionCounts("post", post.id);

    // TODO: Replace with actual user ID from your auth system
    const userId = 1; // This should come from your authentication system
    const userReaction = await getUserReaction(userId, "post", post.id);

    // Check if current user is the author of the post
    const isAuthor = post.user_id === userId;

    // Get replies for each comment and their reaction data
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await getRepliesByCommentId(comment.id);
        const commentReactionCounts = await getReactionCounts(
          "comment",
          comment.id
        );
        const commentUserReaction = await getUserReaction(
          userId,
          "comment",
          comment.id
        );

        return {
          ...comment,
          replies,
          reactionCounts: commentReactionCounts,
          userReaction: commentUserReaction?.type || null,
        };
      })
    );

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/blogs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg
              className="mr-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to blogs
          </Link>
        </div>

        {/* Post Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 flex-1 baskervville">
              {post.title}
            </h1>

            {/* Edit and Delete buttons - only show if user is the author */}
            {isAuthor && (
              <div className="ml-4 flex-shrink-0">
                <PostActions
                  postId={post.id}
                  postSlug={post.slug}
                  postTitle={post.title}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600 space-x-4">
              <time className="text-sm">
                Published{" "}
                {post.created_at &&
                  new Date(post.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </time>

              {post.updated_at &&
                post.created_at &&
                post.updated_at !== post.created_at && (
                  <span className="text-sm">
                    Updated{" "}
                    {new Date(post.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
            </div>

            {/* Post Reactions */}
            <ReactionButton
              targetType="post"
              targetId={post.id}
              userId={userId}
              initialUpvotes={postReactionCounts.upvotes}
              initialDownvotes={postReactionCounts.downvotes}
              userReaction={userReaction?.type || null}
            />
          </div>
        </header>

        {/* Post Content */}
        <article className="prose prose-lg max-w-none mb-12">
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Comments Section */}
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <div className="mb-8">
            <CommentForm postId={post.id} userId={userId} />
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {commentsWithReplies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              commentsWithReplies.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  replies={comment.replies}
                  userId={userId}
                  reactionCounts={comment.reactionCounts}
                  userReaction={comment.userReaction}
                />
              ))
            )}
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/blogs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg
              className="mr-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all posts
          </Link>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Error loading post:", error);
    notFound();
  }
}
