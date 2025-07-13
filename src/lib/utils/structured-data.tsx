// lib/utils/structured-data.ts
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
    ...(post.created_at && {
      datePublished: new Date(post.created_at).toISOString(),
    }),
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
    ...(postImage && {
      image: {
        "@type": "ImageObject",
        url: postImage.image_url,
        width: 1200,
        height: 630,
      },
    }),
    commentCount: comments.length,
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

// Component for rendering the structured data
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
