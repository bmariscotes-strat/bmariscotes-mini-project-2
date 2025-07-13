// app/blogs/[slug]/page.tsx
import { getPostBySlug } from "@/lib/actions/posts";
import {
  getCommentsByPostId,
  getRepliesByCommentId,
} from "@/lib/actions/comments";
import { getReactionCounts, getUserReaction } from "@/lib/actions/reactions";
import { getUserById } from "@/lib/actions/users"; // Add this import
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactionButton from "@/components/ui/ReactionButton";
import CommentForm from "@/components/ui/CommentForm";
import Comment from "@/components/ui/Comment";
import PostActions from "@/components/ui/PostActions";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthPrompt } from "@/components/auth/AuthPrompt";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { getCurrentUser } from "@/lib/actions/users";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Author {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: Date | null;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound();
    }

    // Get the post author's information
    const postAuthor = await getUserById(post.user_id);

    // Get comments and reactions
    const comments = await getCommentsByPostId(post.id);
    const postReactionCounts = await getReactionCounts("post", post.id);

    // Get current user - but don't require authentication for viewing
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id || null;

    // Only get user-specific data if user is logged in
    const userReaction = userId
      ? await getUserReaction(userId, "post", post.id)
      : null;

    // Check if current user is the author of the post
    const isAuthor = userId && post.user_id === userId;

    // Get replies for each comment and their reaction data
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await getRepliesByCommentId(comment.id);
        const commentReactionCounts = await getReactionCounts(
          "comment",
          comment.id
        );
        const commentUserReaction = userId
          ? await getUserReaction(userId, "comment", comment.id)
          : null;

        return {
          ...comment,
          replies,
          reactionCounts: commentReactionCounts,
          userReaction: commentUserReaction?.type || null,
        };
      })
    );

    // Helper function to format author name
    const getAuthorName = (author: Author | null) => {
      if (!author) return "Unknown Author";

      // If both first and last name are available
      if (author.first_name && author.last_name) {
        return `${author.first_name} ${author.last_name}`;
      }

      // If only first name is available
      if (author.first_name) {
        return author.first_name;
      }

      // If only last name is available
      if (author.last_name) {
        return author.last_name;
      }

      // Fallback to email if no names are available
      return author.email || "Unknown Author";
    };

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/blogs"
            className="inline-flex items-center text-primary hover:text-primary text-sm transition-colors"
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
            Back To Blogs
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
              <span className="text-sm font-medium">
                By {getAuthorName(postAuthor)}
              </span>
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

            {/* Post Reactions - only show if user is logged in */}
            {userId && (
              <ReactionButton
                targetType="post"
                targetId={post.id}
                userId={userId}
                initialUpvotes={postReactionCounts.upvotes}
                initialDownvotes={postReactionCounts.downvotes}
                userReaction={userReaction?.type || null}
              />
            )}
          </div>
        </header>

        {/* Post Content */}
        <article className="prose prose-lg max-w-none mb-12">
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Share functionality - Always visible */}
        <div className="mt-8 mb-8 border-t border-gray-200  pt-8">
          <h3 className="text-lg font-semibold mb-4">Share this post</h3>
          <ShareButtons
            url={`${process.env.NEXT_PUBLIC_APP_URL}/blogs/${slug}`}
            title={post.title}
          />
        </div>

        {/* Comments Section */}
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Comment Form with Authentication Guard */}
          <div className="mb-8">
            <AuthGuard
              fallback={<AuthPrompt action="comment" />}
              showPrompt={false}
            >
              {userId && <CommentForm postId={post.id} userId={userId} />}
            </AuthGuard>
          </div>

          {/* Comments List - Always visible */}
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
      </div>
    );
  } catch (error) {
    console.error("Error loading post:", error);
    notFound();
  }
}
