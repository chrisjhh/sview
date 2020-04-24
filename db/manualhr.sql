CREATE TABLE public.manualhr
(
    strava_id bigint NOT NULL,
    max_heartrate real,
    average_heartrate real,
    PRIMARY KEY (strava_id)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.manualhr
    OWNER to postgres;
