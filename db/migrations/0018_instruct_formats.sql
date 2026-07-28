CREATE TABLE `instruct_formats` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`system_prefix` text NOT NULL,
	`system_suffix` text NOT NULL,
	`input_prefix` text NOT NULL,
	`input_suffix` text NOT NULL,
	`output_suffix` text NOT NULL,
	`output_prefix` text NOT NULL,
	`last_output_prefix` text DEFAULT '' NOT NULL,
	`stop_sequence` text NOT NULL,
	`activation_regex` text DEFAULT '' NOT NULL,
	`user_alignment_message` text DEFAULT '' NOT NULL,
	`wrap` integer DEFAULT false NOT NULL,
	`macro` integer DEFAULT false NOT NULL,
	`names` integer DEFAULT false NOT NULL,
	`names_force_groups` integer DEFAULT false NOT NULL,
	`timestamp` integer DEFAULT false NOT NULL,
	`examples` integer DEFAULT true NOT NULL,
	`scenario` integer DEFAULT true NOT NULL,
	`personality` integer DEFAULT true NOT NULL,
	`hide_think_tags` integer DEFAULT true NOT NULL,
	`use_common_stop` integer DEFAULT true NOT NULL,
	`send_images` integer DEFAULT true NOT NULL,
	`send_audio` integer DEFAULT true NOT NULL,
	`send_documents` integer DEFAULT true NOT NULL,
	`last_image_only` integer DEFAULT true NOT NULL,
	`system_prompt_format` text DEFAULT '{{system_prefix}}{{system_prompt}}
{{character_desc}}
{{personality}}
{{scenario}}
{{user_desc}}{{system_suffix}}' NOT NULL
);
