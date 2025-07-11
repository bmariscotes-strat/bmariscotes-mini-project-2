import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

/* ---------------- ENUMS ---------------- */

// Reaction type enum: 'upvote' | 'downvote'
export const reactionTypeEnum = pgEnum("reaction_type", ["upvote", "downvote"]);

// Target type enum: 'post' | 'comment' | 'reply'
export const targetTypeEnum = pgEnum("target_type", [
  "post",
  "comment",
  "reply",
]);

/* ---------------- TABLES ---------------- */

// Users

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerk_id: varchar("clerk_id", { length: 255 }).notNull().unique(),
    first_name: varchar("first_name", { length: 255 }), // New column
    last_name: varchar("last_name", { length: 255 }), // New column
    email: varchar("email", { length: 255 }).notNull().unique(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Index for Clerk ID lookups
    clerkIdIdx: index("idx_users_clerk_id").on(table.clerk_id),
    // Index for user lookups by email (already unique, but explicit index for performance)
    emailIdx: index("idx_users_email").on(table.email),
    // Index for sorting users by creation date
    createdAtIdx: index("idx_users_created_at").on(table.created_at),
  })
);

// Posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Comments
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    post_id: integer("post_id")
      .references(() => posts.id)
      .notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Index for fetching comments by post
    postIdIdx: index("idx_comments_post_id").on(table.post_id),
    // Index for fetching comments by user
    userIdIdx: index("idx_comments_user_id").on(table.user_id),
    // Composite index for user's comments on specific posts
    userPostIdx: index("idx_comments_user_post").on(
      table.user_id,
      table.post_id
    ),
  })
);

// Replies
export const replies = pgTable(
  "replies",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    comment_id: integer("comment_id")
      .references(() => comments.id, { onDelete: "cascade" }) // Add cascade delete
      .notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Index for fetching replies by comment
    commentIdIdx: index("idx_replies_comment_id").on(table.comment_id),
    // Index for fetching replies by user
    userIdIdx: index("idx_replies_user_id").on(table.user_id),
    // Composite index for user's replies on specific comments
    userCommentIdx: index("idx_replies_user_comment").on(
      table.user_id,
      table.comment_id
    ),
  })
);

// Reactions (polymorphic, for posts/comments/replies)
export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    type: reactionTypeEnum("type").notNull(), // 'upvote' | 'downvote'
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    target_type: targetTypeEnum("target_type").notNull(), // 'post' | 'comment' | 'reply'
    target_id: integer("target_id").notNull(), // ID of target entity (post/comment/reply)
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Index for fetching reactions by target (post/comment/reply)
    targetIdx: index("idx_reactions_target").on(
      table.target_type,
      table.target_id
    ),
    // Index for fetching user's reactions
    userIdx: index("idx_reactions_user").on(table.user_id),
    // Composite index for user's reaction on specific targets (prevents duplicate reactions)
    userTargetIdx: index("idx_reactions_user_target").on(
      table.user_id,
      table.target_type,
      table.target_id
    ),
    // Index for reaction type queries
    typeIdx: index("idx_reactions_type").on(table.type),
    // Composite index for target reactions by type (for counting upvotes/downvotes)
    targetTypeIdx: index("idx_reactions_target_type").on(
      table.target_type,
      table.target_id,
      table.type
    ),
  })
);

// Post Images
export const postImages = pgTable(
  "post_images",
  {
    id: serial("id").primaryKey(),
    post_id: integer("post_id")
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    image_url: varchar("image_url", { length: 512 }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Index for fetching images by post
    postIdIdx: index("idx_post_images_post_id").on(table.post_id),
  })
);

/* ---------------- ADDITIONAL INDEXES FOR PERFORMANCE ---------------- */

// Additional indexes for the posts table
export const postsIndexes = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    content: text("content").notNull(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Index for fetching posts by user
    userIdIdx: index("idx_posts_user_id").on(table.user_id),
    // Index for sorting posts by creation date
    createdAtIdx: index("idx_posts_created_at").on(table.created_at),
    // Index for slug lookups (already unique, but explicit index for performance)
    slugIdx: index("idx_posts_slug").on(table.slug),
    // Composite index for user's posts sorted by date
    userCreatedAtIdx: index("idx_posts_user_created_at").on(
      table.user_id,
      table.created_at
    ),
  })
);
