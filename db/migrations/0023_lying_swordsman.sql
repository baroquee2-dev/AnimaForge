ALTER TABLE `chats` ADD `summary_token_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `chats` DROP COLUMN `summary_char_count`;