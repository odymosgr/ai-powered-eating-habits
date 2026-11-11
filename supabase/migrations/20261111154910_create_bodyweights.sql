CREATE TABLE "public"."bodyweights" (
  "id"          uuid                     NOT NULL,
  "weight_kg"   numeric                  NOT NULL,
  "measured_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "bodyweights_weight_kg_check" CHECK (((weight_kg >= (20)::numeric) AND (weight_kg <= (400)::numeric))),
  "user_id"     uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "bodyweights_pkey" PRIMARY KEY (user_id, id)
);

ALTER TABLE "public"."bodyweights"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."bodyweights" FROM "anon";

REVOKE ALL ON TABLE "public"."bodyweights" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."bodyweights" TO "authenticated";

REVOKE ALL ON TABLE "public"."bodyweights" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bodyweights" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bodyweights" TO "service_role";

ALTER TABLE "public"."bodyweights"
  ADD CONSTRAINT "bodyweights_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX bodyweights_user_id_measured_at_idx ON public.bodyweights USING btree (user_id, measured_at);

CREATE POLICY "Users add their own bodyweights" ON "public"."bodyweights"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users delete their own bodyweights" ON "public"."bodyweights"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users see their own bodyweights" ON "public"."bodyweights"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users update their own bodyweights" ON "public"."bodyweights"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

