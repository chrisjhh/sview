-- Table: public.properties

-- DROP TABLE public.properties;

CREATE TABLE public.properties
(
    key character varying(255) COLLATE pg_catalog."default" NOT NULL,
    value character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT properties_pkey PRIMARY KEY (key)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.properties
    OWNER to postgres;
