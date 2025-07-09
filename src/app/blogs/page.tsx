import { getAllPosts } from "@/lib/actions/posts";
import Link from "next/link";
import PostEditor from "@/components/ui/PostEditor";
import Image from "next/image";

// Helper function to extract plain text from HTML content
function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Helper function to truncate content
function truncateContent(content: string, maxLength: number = 200): string {
  const plainText = extractPlainText(content);
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + "...";
}

// Helper function to extract first image from HTML content
function extractFirstImage(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

export default async function Blog() {
  const posts = await getAllPosts();

  // Sort posts latest to oldest
  const sortedPosts = posts.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // descending order
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Post Editor */}
      <div className="mb-12">
        <PostEditor />
      </div>

      {/* Blog Feed */}
      <div className="space-y-8">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No posts yet. Create your first post above!
            </p>
          </div>
        ) : (
          sortedPosts.map((post) => {
            const firstImage = extractFirstImage(post.content);
            const truncatedContent = truncateContent(post.content);

            return (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Featured Image */}
                {firstImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <Image
                      src={firstImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      width={1280}
                      height={720}
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition-colors">
                    <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <div className="text-gray-600 mb-4 leading-relaxed">
                    {truncatedContent}
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      See more
                      <svg
                        className="ml-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>

                    <time className="text-sm text-gray-500">
                      {post.created_at &&
                        new Date(post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </time>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
