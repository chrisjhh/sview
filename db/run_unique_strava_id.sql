ALTER TABLE public.runs
    ADD CONSTRAINT run_unique_strava_id UNIQUE (strava_id);
