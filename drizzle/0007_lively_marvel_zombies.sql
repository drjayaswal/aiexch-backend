ALTER TABLE "user_read_notifications" DROP CONSTRAINT "user_read_notifications_notification_id_notifications_id_fk";
--> statement-breakpoint
ALTER TABLE "user_read_notifications" ADD CONSTRAINT "user_read_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;