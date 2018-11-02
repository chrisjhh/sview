--
-- PostgreSQL database dump
--

-- Dumped from database version 10.5 (Debian 10.5-1.pgdg90+1)
-- Dumped by pg_dump version 10.5 (Debian 10.5-1.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    key character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routes (
    id integer NOT NULL,
    name character varying(255),
    distance real NOT NULL,
    elevation real NOT NULL,
    start_latlng point NOT NULL,
    end_latlng point NOT NULL
);


ALTER TABLE public.routes OWNER TO postgres;

--
-- Name: routes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.routes_id_seq OWNER TO postgres;

--
-- Name: routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.routes_id_seq OWNED BY public.routes.id;


--
-- Name: runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.runs (
    id integer NOT NULL,
    name character varying(255),
    start_time timestamp with time zone NOT NULL,
    distance real,
    duration real,
    elevation real,
    start_latlng point,
    end_latlng point,
    is_race boolean DEFAULT false NOT NULL,
    average_heartrate real,
    max_heartrate real,
    average_cadence real,
    route_id integer,
    strava_id bigint,
    moving_time real
);


ALTER TABLE public.runs OWNER TO postgres;

--
-- Name: runs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.runs_id_seq OWNER TO postgres;

--
-- Name: runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.runs_id_seq OWNED BY public.runs.id;


--
-- Name: routes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes ALTER COLUMN id SET DEFAULT nextval('public.routes_id_seq'::regclass);


--
-- Name: runs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs ALTER COLUMN id SET DEFAULT nextval('public.runs_id_seq'::regclass);


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.properties VALUES ('version', '1.0');


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.routes VALUES (1, NULL, 4995, 45.2000008, '(52.3900000000000006,-1.52000000000000002)', '(52.3900000000000006,-1.52000000000000002)');
INSERT INTO public.routes VALUES (4, NULL, 9749, 105.400002, '(55.990000000000002,-3.52000000000000002)', '(56,-3.52000000000000002)');
INSERT INTO public.routes VALUES (2, NULL, 6939.3335, 34.9333344, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)');
INSERT INTO public.routes VALUES (5, NULL, 4947, 24.7999992, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)');
INSERT INTO public.routes VALUES (3, NULL, 3299.85718, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)');


--
-- Data for Name: runs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.runs VALUES (1, 'Coventry parkrun', '2018-08-04 09:06:48+00', 4995, 1364, 45.2000008, '(52.3900000000000006,-1.52000000000000002)', '(52.3900000000000006,-1.52000000000000002)', true, 172.300003, 186, 83.3000031, 1, 1748412665, 1358);
INSERT INTO public.runs VALUES (2, 'Morning Run', '2018-08-02 07:00:59+00', 6960, 2352, 35, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 158.5, 168, 79.0999985, 2, 1744393004, 2333);
INSERT INTO public.runs VALUES (3, 'Morning Run', '2018-08-01 07:13:30+00', 3321, 1003, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 164.100006, 175, 80.5, 3, 1742998138, 1003);
INSERT INTO public.runs VALUES (4, 'Evening Run', '2018-07-31 18:20:35+00', 6927, 2246, 34.9000015, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 159.300003, 173, 79.0999985, 2, 1740587419, 2243);
INSERT INTO public.runs VALUES (5, 'Magical Blackness run.', '2018-07-29 07:35:08+00', 9749, 3095, 105.400002, '(55.990000000000002,-3.52000000000000002)', '(56,-3.52000000000000002)', false, 167, 183, 79.8000031, 4, 1734895366, 3018);
INSERT INTO public.runs VALUES (6, 'Morning Run', '2018-07-26 07:00:12+00', 6931, 2224, 34.9000015, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 163.399994, 176, 79.6999969, 2, 1728901252, 2209);
INSERT INTO public.runs VALUES (7, 'Morning Run', '2018-07-25 07:06:09+00', 3293, 1047, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 159.300003, 172, 79.8000031, 3, 1727252458, 1047);
INSERT INTO public.runs VALUES (8, 'Morning Run', '2018-07-24 07:06:01+00', 3261, 1066, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 156.5, 167, 78.9000015, 3, 1725518944, 1066);
INSERT INTO public.runs VALUES (9, 'Morning Run', '2018-07-23 06:57:05+00', 4917, 1647, 24.7999992, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 154, 167, 78.8000031, 5, 1722864228, 1644);
INSERT INTO public.runs VALUES (10, 'Afternoon Run', '2018-07-20 13:40:12+00', 4950, 1452, 24.8999996, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 166.100006, 187, 79.9000015, 5, 1715293108, 1452);
INSERT INTO public.runs VALUES (11, 'Morning Run', '2018-07-19 07:03:34+00', 4959, 1541, 24.7000008, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 162.5, 181, 79.9000015, 5, 1713727309, 1541);
INSERT INTO public.runs VALUES (12, 'Morning Run', '2018-07-18 06:58:52+00', 3296, 1013, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 163.699997, 178, 79.8000031, 3, 1710151942, 1013);
INSERT INTO public.runs VALUES (13, 'Morning Run', '2018-07-17 06:56:35+00', 3283, 979, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 166.199997, 179, 80.5, 3, 1709325759, 979);
INSERT INTO public.runs VALUES (14, 'Morning Run', '2018-07-16 07:04:27+00', 4966, 1574, 24.7999992, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 169.699997, 178, 78.3000031, 5, 1709324116, 1574);
INSERT INTO public.runs VALUES (15, 'Morning Run', '2018-07-12 07:10:44+00', 4943, 1729, 24.7999992, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 154.199997, 165, 78.0999985, 5, 1697022714, 1729);
INSERT INTO public.runs VALUES (16, 'Morning Run', '2018-07-11 07:11:41+00', 3317, 958, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 162.800003, 180, 80.5999985, 3, 1694908426, 958);
INSERT INTO public.runs VALUES (17, 'Morning Run', '2018-07-10 07:01:25+00', 3328, 1032, 8.89999962, '(52.509999999999998,-1.42999999999999994)', '(52.509999999999998,-1.42999999999999994)', false, 164.600006, 176, 79.3000031, 3, 1692619910, 1029);


--
-- Name: routes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.routes_id_seq', 5, true);


--
-- Name: runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.runs_id_seq', 17, true);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (key);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: runs run_unique_start_time; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT run_unique_start_time UNIQUE (start_time);


--
-- Name: runs runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_pkey PRIMARY KEY (id);


--
-- Name: fki_run_route_id_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_run_route_id_fkey ON public.runs USING btree (route_id);


--
-- Name: runs run_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT run_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- PostgreSQL database dump complete
--

