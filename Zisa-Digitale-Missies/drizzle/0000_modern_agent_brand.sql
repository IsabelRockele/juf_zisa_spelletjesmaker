CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`open` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lessons_code` ON `lessons` (`code`);--> statement-breakpoint
CREATE INDEX `idx_lessons_owner_created` ON `lessons` (`owner`,`created_at`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`name` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_works_lesson_created` ON `works` (`lesson_id`,`created_at`);