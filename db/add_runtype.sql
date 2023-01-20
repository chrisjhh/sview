ALTER TABLE public.runs
    ADD COLUMN runtype character varying(255) COLLATE pg_catalog."default"
    DEFAULT 'Run';
