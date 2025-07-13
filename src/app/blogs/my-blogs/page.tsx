// src/app/blogs/my-blogs/page.tsx
import { getAllPosts } from "@/lib/actions/posts";
import { getPostStats } from "@/lib/actions/reactions";
import Link from "next/link";
import PostEditor from "@/components/ui/post/PostEditor";
import Image from "next/image";
import { MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/users";
import { truncateContent, extractAllImages } from "@/lib/utils/helper";

export default async function MyBlogs() {
  const user = await getCurrentUser();

  // Redirect or show message if user is not authenticated
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Please log in to view your blogs.
          </p>
        </div>
      </div>
    );
  }

  const allPosts = await getAllPosts();

  // Filter posts to only show current user's posts
  const userPosts = allPosts.filter((post) => post.author.id === user.id);

  // Sort posts latest to oldest
  const sortedPosts = userPosts.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // descending order
  });

  // Get stats for each post
  const postsWithStats = await Promise.all(
    sortedPosts.map(async (post) => {
      const stats = await getPostStats(post.id);
      return { ...post, stats };
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Floating Post Editor */}
      <PostEditor />

      {/* My Blogs Feed */}
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/30 rounded-md p-6 text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            My Wrytes
          </h1>
          <p className="text-gray-600 text-base">
            Wryter {user.first_name || "Writer"}! Here are your published
            stories.
          </p>
        </div>

        {postsWithStats.length === 0 ? (
          <div className="text-center flex flex-col justify-center items-center">
            <Image
              src="/vectors/writing.png"
              alt="Logo"
              width={250}
              height={250}
            />
            <h4 className="pt-4 text-gray-600 mb-5">
              You haven&apos;t published any post yet. Write one now!
            </h4>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {postsWithStats.length}{" "}
              {postsWithStats.length === 1 ? "blog" : "blogs"}
            </p>
          </div>
        )}

        {postsWithStats.map((post) => {
          const images = extractAllImages(post.content);
          const truncatedContent = truncateContent(post.content, 700);
          const isNewPost =
            post.created_at &&
            (Date.now() - new Date(post.created_at).getTime()) / 1000 < 30;

          return (
            <article
              key={post.id}
              className={`bg-white rounded-md border-2 border-gray-100 overflow-hidden transition-all duration-500 ${
                isNewPost ? "animate-pulse-glow" : ""
              }`}
            >
              {/* Images Section */}
              {images.length > 0 && (
                <div className="p-4 pb-0">
                  {images.length === 1 ? (
                    // Single image
                    <div className="rounded-xl overflow-hidden">
                      <Image
                        src={images[0]}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                        width={600}
                        height={300}
                      />
                    </div>
                  ) : (
                    // Multiple images - grid layout
                    <div
                      className={`grid gap-2 rounded-xl overflow-hidden ${
                        images.length === 2
                          ? "grid-cols-2"
                          : images.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-2"
                      }`}
                    >
                      {images.slice(0, 4).map((image, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={`relative ${
                            images.length === 3 && imgIndex === 0
                              ? "col-span-2"
                              : ""
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${post.title} - ${imgIndex + 1}`}
                            className="w-full h-32 object-cover"
                            width={300}
                            height={200}
                          />
                          {imgIndex === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">
                                +{images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Post Content */}
              <div className="p-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2 tracking-wider baskervville text-primary">
                    {post.title}
                  </h2>

                  {/* Author Information - Since it's the current user's post */}
                  <p className="text-gray-600 text-sm mb-3 baskervville">
                    Written by you
                  </p>
                </div>

                <div className="text-gray-700 mb-4 leading-relaxed text-sm">
                  {truncatedContent}
                </div>

                {/* Post Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <div className="flex items-center space-x-4">
                    {/* Reaction Stats */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <ChevronUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">
                          {post.stats.upvotes}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChevronDown className="w-4 h-4 text-red-500" />
                        <span className="font-medium">
                          {post.stats.downvotes}
                        </span>
                      </div>
                    </div>

                    {/* Comment Count */}
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{post.stats.comments}</span>
                    </div>
                  </div>

                  <Link
                    href={`/blogs/${post.slug}`}
                    className="text-primary/70 hover:text-primary hover:font-semibold font-medium justify-end text-sm transition-colors"
                  >
                    Read more
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
