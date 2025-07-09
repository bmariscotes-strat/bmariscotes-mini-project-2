CREATE INDEX "idx_comments_post_id" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_comments_user_id" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comments_user_post" ON "comments" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "idx_post_images_post_id" ON "post_images" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_posts_user_id" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_posts_created_at" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_slug" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_posts_user_created_at" ON "posts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_reactions_target" ON "reactions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_reactions_user" ON "reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reactions_user_target" ON "reactions" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_reactions_type" ON "reactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_reactions_target_type" ON "reactions" USING btree ("target_type","target_id","type");--> statement-breakpoint
CREATE INDEX "idx_replies_comment_id" ON "replies" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_replies_user_id" ON "replies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_replies_user_comment" ON "replies" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");