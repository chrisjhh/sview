-- Table: public.routes

-- DROP TABLE public.routes;

CREATE TABLE public.routes
(
    id serial NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    distance real NOT NULL,
    elevation real NOT NULL,
    start_latlng point NOT NULL,
    end_latlng point NOT NULL,
    CONSTRAINT routes_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.routes
    OWNER to postgres;
