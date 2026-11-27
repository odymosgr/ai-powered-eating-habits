-- The app starts from no history: the old test weights are dropped, not migrated (spec #1).
DROP TABLE "public"."bodyweights";

CREATE TABLE "public"."bodyweight_entry_attempts" (
  "id"         uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL DEFAULT auth.uid(),
  "day"        date                     NOT NULL,
  -- Empty when the attempt clears the day.
  "weight_kg"  numeric,
  -- False when the user declined a pop-up.
  "confirmed"  boolean                  NOT NULL,
  "saved_at"   timestamp with time zone NOT NULL DEFAULT now(),
  -- The phone's IANA timezone, e.g. Europe/Athens.
  "timezone"   text                     NOT NULL,
  CONSTRAINT "bodyweight_entry_attempts_pkey" PRIMARY KEY (user_id, id),
  CONSTRAINT "bodyweight_entry_attempts_weight_kg_check" CHECK (weight_kg BETWEEN 20 AND 400),
  CONSTRAINT "bodyweight_entry_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."bodyweight_entry_attempts"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."bodyweight_entry_attempts" FROM "anon";

REVOKE ALL ON TABLE "public"."bodyweight_entry_attempts" FROM "authenticated";

-- Append-only: no update or delete. Insert leaves out saved_at, so only the server sets it.
GRANT SELECT ON TABLE "public"."bodyweight_entry_attempts" TO "authenticated";

GRANT INSERT ("id", "user_id", "day", "weight_kg", "confirmed", "timezone")
  ON TABLE "public"."bodyweight_entry_attempts" TO "authenticated";

CREATE INDEX bodyweight_entry_attempts_user_id_saved_at_idx
  ON public.bodyweight_entry_attempts USING btree (user_id, saved_at);

CREATE POLICY "Users add their own bodyweight entry attempts" ON "public"."bodyweight_entry_attempts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users see their own bodyweight entry attempts" ON "public"."bodyweight_entry_attempts"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));
