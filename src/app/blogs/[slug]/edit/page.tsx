// app/blogs/[slug]/edit/page.tsx
import { getPostBySlug } from "@/lib/actions/posts";
import { notFound, redirect } from "next/navigation";
import EditPostForm from "@/components/ui/EditPostForm";

interface EditPostPageProps {
  params: {
    slug: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  console.log("Edit page - received params:", params);
  console.log("Edit page - received slug:", params.slug);
  console.log("Edit page - decoded slug:", decodeURIComponent(params.slug));

  try {
    const post = await getPostBySlug(decodeURIComponent(params.slug));

    console.log("Edit page - getPostBySlug completed");
    console.log("Edit page - post found:", !!post);

    if (post) {
      console.log("Edit page - post data:", {
        id: post.id,
        title: post.title,
        slug: post.slug,
        user_id: post.user_id,
      });
    }

    if (!post) {
      console.log("Edit page - post not found, calling notFound()");
      notFound();
    }

    // TODO: Replace with actual user ID from your auth system
    const userId = 1; // This should come from your authentication system

    // Check if current user is the author of the post
    if (post.user_id !== userId) {
      console.log("Edit page - user not authorized, redirecting");
      redirect("/blogs");
    }

    console.log("Edit page - rendering EditPostForm");
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EditPostForm post={post} />
      </div>
    );
  } catch (error) {
    console.error("Edit page - Catch block triggered");
    console.error("Edit page - Error loading post for editing:", error);
    console.error("Edit page - Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      slug: params.slug,
      errorType: typeof error,
    });
    notFound();
  }
}
