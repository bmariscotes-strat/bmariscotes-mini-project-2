import { getPostBySlug } from "@/lib/actions/posts";
import { notFound, redirect } from "next/navigation";
import EditPostForm from "@/components/ui/post/EditPostForm";
import { getCurrentUser } from "@/lib/actions/users";

interface EditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params;

  console.log("Edit page - received slug:", slug);
  console.log("Edit page - decoded slug:", decodeURIComponent(slug));

  try {
    const post = await getPostBySlug(decodeURIComponent(slug));

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

    // Assignment of current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Please log in to create a post");
    }

    const userId = currentUser.id;

    // Check if current user is the author of the post
    if (post.user_id !== userId) {
      console.log("Edit page - user not authorized, redirecting");
      redirect("/blogs");
    }

    console.log("Edit page - rendering EditPostForm");
    return <EditPostForm post={post} />;
  } catch (error) {
    console.error("Edit page - Catch block triggered");
    console.error("Edit page - Error loading post for editing:", error);
    console.error("Edit page - Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      slug: slug,
      errorType: typeof error,
    });
    notFound();
  }
}
