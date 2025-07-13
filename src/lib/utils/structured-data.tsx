import React from "react";
import {
  Author,
  Post,
  Comment,
  PostImage,
  ReactionCounts,
} from "@/interface/types";

interface StructuredDataProps {
  post: Post;
  postAuthor: Author | null;
  postImage: PostImage | null;
  comments: Comment[];
  postReactionCounts: ReactionCounts;
  extractTextFromHtml: (html: string) => string;
  truncateText: (text: string, maxLength?: number) => string;
  getAuthorName: (author: Author | null) => string;
}

/**
 * Generates Schema.org structured data for a blog post
 * Improves SEO by providing search engines with rich metadata
 */
export function generateBlogPostStructuredData({
  post,
  postAuthor,
  postImage,
  comments,
  postReactionCounts,
  extractTextFromHtml,
  truncateText,
  getAuthorName,
}: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const postUrl = `${baseUrl}/blogs/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: truncateText(extractTextFromHtml(post.content)),
    author: {
      "@type": "Person",
      name: getAuthorName(postAuthor),
    },
    // Optional: Only include dates if they exist
    ...(post.created_at && {
      datePublished: new Date(post.created_at).toISOString(),
    }),
    // Only include dateModified if it differs from creation date
    ...(post.updated_at &&
      post.updated_at !== post.created_at && {
        dateModified: new Date(post.updated_at).toISOString(),
      }),
    url: postUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Wryte",
      logo: {
        "@type": "ImageObject",
        url: "https://wryte.vercel.app/branding/logo.png",
      },
    },
    // Optional: Include image metadata if available
    ...(postImage && {
      image: {
        "@type": "ImageObject",
        url: postImage.image_url,
        width: 1200, // Standard social media image dimensions
        height: 630,
      },
    }),
    commentCount: comments.length,
    // Engagement metrics for rich snippets
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: postReactionCounts.upvotes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/DislikeAction",
        userInteractionCount: postReactionCounts.downvotes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: comments.length,
      },
    ],
  };
}

/**
 * React component that renders structured data as JSON-LD script
 * Should be placed in the document head for SEO
 */
interface StructuredDataScriptProps {
  data: object;
}

export function StructuredDataScript({ data }: StructuredDataScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
