ALTER TABLE `users` ADD `weekly_target_minutes` integer DEFAULT 2400 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `work_days_per_week` integer DEFAULT 5 NOT NULL;
