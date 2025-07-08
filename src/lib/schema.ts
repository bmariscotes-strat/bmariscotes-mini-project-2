import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
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
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashed_password: text("hashed_password").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

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
export const comments = pgTable("comments", {
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
});

// Replies
export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  comment_id: integer("comment_id")
    .references(() => comments.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Reactions (polymorphic, for posts/comments/replies)
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  type: reactionTypeEnum("type").notNull(), // 'upvote' | 'downvote'
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  target_type: targetTypeEnum("target_type").notNull(), // 'post' | 'comment' | 'reply'
  target_id: integer("target_id").notNull(), // ID of target entity (post/comment/reply)
  created_at: timestamp("created_at").defaultNow(),
});

// Post Images
export const postImages = pgTable("post_images", {
  id: serial("id").primaryKey(),
  post_id: integer("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  image_url: varchar("image_url", { length: 512 }).notNull(),
  alt_text: varchar("alt_text", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});
