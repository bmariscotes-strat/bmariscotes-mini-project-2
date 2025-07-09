import { getPostBySlug } from "@/lib/actions/posts";
import Link from "next/link";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const post = await getPostBySlug(params.slug);

    if (!post) {
      notFound();
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

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
        </header>

        {/* Post Content */}
        <article className="prose prose-lg max-w-none">
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

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
