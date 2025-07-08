import { db } from "@/lib/db";
import { posts, postImages } from "@/lib/schema";
import slugify from "slugify";

/**
 * Inserts a new post with multiple image URLs into the database.
 *
 * @param title        - Post title
 * @param content      - Rich text (HTML string from TipTap)
 * @param userId       - Author's user id
 * @param imageUrls    - Array of image URLs from Cloudinary
 */
export async function insertPostWithImages(
  title: string,
  content: string,
  userId: number,
  imageUrls: string[]
) {
  // Generate slug from title
  const slug = slugify(title, { lower: true, strict: true });

  const newPost = await db
    .insert(posts)
    .values({
      title,
      slug,
      content,
      user_id: userId,
    })
    .returning({ id: posts.id });

  const postId = newPost[0]?.id;
  if (!postId) throw new Error("Failed to create post");

  // Insert images
  if (imageUrls.length > 0) {
    await db.insert(postImages).values(
      imageUrls.map((url) => ({
        post_id: postId,
        image_url: url,
      }))
    );
  }

  return postId;
}
