-- Table: public.weather

-- DROP TABLE public.weather;

CREATE TABLE public.weather
(
    id serial NOT NULL,
    strava_id bigint NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    city character varying(60) COLLATE pg_catalog."default",
    wind_speed real,
    wind_direction real,
    humidity real,
    dew_point real,
    pressure real,
    snow real,
    precipitation real,
    temperature real,
    cloud_coverage real,
    solar_elevation real,
    solar_azimuth real,
    visibility real,
    sea_level_pressure real,
    uv real,
    CONSTRAINT weather_pkey PRIMARY KEY (id),
    CONSTRAINT weather_unique_run_timestamp UNIQUE (strava_id, "timestamp"),
    CONSTRAINT weather_run_strava_id_fkey FOREIGN KEY (strava_id)
        REFERENCES public.runs (strava_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.weather
    OWNER to postgres;

-- Index: fki_weather_run_id_fkey

-- DROP INDEX public.fki_weather_run_id_fkey;

CREATE INDEX fki_weather_strava_id_fkey
    ON public.weather USING btree
    (strava_id)
    TABLESPACE pg_default;