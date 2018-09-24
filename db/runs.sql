-- Table: public.runs

-- DROP TABLE public.runs;

CREATE TABLE public.runs
(
    id integer NOT NULL DEFAULT nextval('run_id_seq'::regclass),
    name character varying(255) COLLATE pg_catalog."default",
    start_time timestamp with time zone NOT NULL,
    distance real,
    duration real,
    elevation real,
    start_latlng point,
    end_latlng point,
    is_race boolean NOT NULL DEFAULT false,
    average_heartrate real,
    max_heartrate real,
    average_cadence real,
    route_id integer,
    strava_id bigint,
    moving_time real,
    CONSTRAINT runs_pkey PRIMARY KEY (id),
    CONSTRAINT run_unique_start_time UNIQUE (start_time)
,
    CONSTRAINT run_route_id_fkey FOREIGN KEY (route_id)
        REFERENCES public.routes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.runs
    OWNER to postgres;

-- Index: fki_run_route_id_fkey

-- DROP INDEX public.fki_run_route_id_fkey;

CREATE INDEX fki_run_route_id_fkey
    ON public.runs USING btree
    (route_id)
    TABLESPACE pg_default;
