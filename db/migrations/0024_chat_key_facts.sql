CREATE TABLE `chat_key_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`category` text DEFAULT 'identity' NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`previous_value` text DEFAULT '' NOT NULL,
	`stale` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_key_facts_chat_id_key_idx` ON `chat_key_facts` (`chat_id`,`key`);