CREATE TABLE "campaign_events" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_events_campaign_id_idx" ON "campaign_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_events_type_idx" ON "campaign_events" USING btree ("campaign_id","event_type");