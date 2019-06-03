--
-- PostgreSQL database dump
--

-- Dumped from database version 10.5 (Debian 10.5-1.pgdg90+1)
-- Dumped by pg_dump version 10.5

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
-- Name: weather; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weather (
    id integer NOT NULL,
    strava_id bigint NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    city character varying(60),
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
    uv real
);


ALTER TABLE public.weather OWNER TO postgres;

--
-- Name: weather_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.weather_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.weather_id_seq OWNER TO postgres;

--
-- Name: weather_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.weather_id_seq OWNED BY public.weather.id;


--
-- Name: routes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes ALTER COLUMN id SET DEFAULT nextval('public.routes_id_seq'::regclass);


--
-- Name: runs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs ALTER COLUMN id SET DEFAULT nextval('public.runs_id_seq'::regclass);


--
-- Name: weather id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weather ALTER COLUMN id SET DEFAULT nextval('public.weather_id_seq'::regclass);


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (key, value) FROM stdin;
version	1.1
\.


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.routes (id, name, distance, elevation, start_latlng, end_latlng) FROM stdin;
3	\N	7482	107.599998	(52.5200000000000031,-1.45999999999999996)	(52.5200000000000031,-1.45999999999999996)
4	\N	3040.5	0	(52.3900000000000006,-0.739999999999999991)	(52.3900000000000006,-0.739999999999999991)
1	\N	21101.5	119.449997	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)
5	\N	4904	40.2999992	(52.4799999999999969,-1.46999999999999997)	(52.4799999999999969,-1.46999999999999997)
8	\N	5217	71.1999969	(52.5600000000000023,-1.84000000000000008)	(52.5600000000000023,-1.84000000000000008)
9	\N	3404	4	(52.5200000000000031,-1.45999999999999996)	(52.509999999999998,-1.45999999999999996)
2	\N	13127.1797	69.3800049	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)
10	\N	12731	69.1999969	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)
7	\N	6899	38.3499985	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)
11	\N	6967	0	(52.5200000000000031,-1.45999999999999996)	(52.5200000000000031,-1.45999999999999996)
6	\N	9975.33301	47.2000008	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)
\.


--
-- Data for Name: runs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.runs (id, name, start_time, distance, duration, elevation, start_latlng, end_latlng, is_race, average_heartrate, max_heartrate, average_cadence, route_id, strava_id, moving_time) FROM stdin;
1	Afternoon Run	2019-06-01 14:53:29+00	21081	6635	121.099998	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	159.800003	185	79.3000031	1	2414955656	6605
2	Lunch Run	2019-05-31 12:21:30+00	13259.9004	4044	69.3000031	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	156.399994	175	79.9000015	2	2411598624	3964
3	Club session. Not on the track! 15 short hill reps at Coton Arches.	2019-05-30 19:31:13+00	7482	3129	107.599998	(52.5200000000000031,-1.45999999999999996)	(52.5200000000000031,-1.45999999999999996)	f	\N	\N	81	3	2410035267	3026
4	MVTFL, Kettering, 3000m.	2019-05-29 20:42:21+00	3040.5	718	0	(52.3900000000000006,-0.739999999999999991)	(52.3900000000000006,-0.739999999999999991)	t	\N	\N	85.5	4	2407412458	718
5	Afternoon Run	2019-05-27 14:18:09+00	21122	6713	117.800003	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	150	163	79.9000015	1	2401556399	6604
6	Bedworth parkrun	2019-05-25 09:02:26+00	4904	1255	40.2999992	(52.4799999999999969,-1.46999999999999997)	(52.4799999999999969,-1.46999999999999997)	t	171.5	185	85.0999985	5	2395064558	1255
7	Lunch Run	2019-05-24 12:10:14+00	13244	4034	69.5999985	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	156	172	80.1999969	2	2393263947	3977
8	Morning Run	2019-05-23 06:53:34+00	9913	3272	47.2999992	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	151.300003	179	80.1999969	6	2389981313	3247
9	Morning Run	2019-05-22 06:51:45+00	9965	3169	47.2000008	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	152.199997	169	80.0999985	6	2387207842	3136
10	Morning Run	2019-05-21 06:46:09+00	6985	2322	38.4000015	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	149	161	79.5	7	2384454700	2307
11	British Masters Road Relays. Leg 1.	2019-05-18 14:04:47+00	5217	1307	71.1999969	(52.5600000000000023,-1.84000000000000008)	(52.5600000000000023,-1.84000000000000008)	t	\N	\N	83.8000031	8	2377309315	1307
12	Pre-relays track session. 6 sets of 150m 50R 50m 150W + warmdown.	2019-05-16 19:49:45+00	3404	1328	4	(52.5200000000000031,-1.45999999999999996)	(52.509999999999998,-1.45999999999999996)	f	158.199997	179	75.0999985	9	2373224828	1284
13	Evening Run	2019-05-15 19:27:38+00	13051	3978	69.3000031	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	154.199997	170	80.5999985	2	2370746678	3961
14	Evening Run	2019-05-14 19:22:42+00	13076	3943	69.3000031	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	157.100006	171	80.4000015	2	2367914608	3929
15	Evening Run	2019-05-13 19:04:41+00	13005	3702	69.4000015	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	164.100006	180	82.0999985	2	2365078919	3690
16	Lunch Run	2019-05-11 12:18:03+00	12731	4200	69.1999969	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	152.800003	169	80.5	10	2358622122	4173
17	Easy Four	2019-05-10 12:05:39+00	6813	2235	38.2999992	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	146.899994	169	80	7	2355996642	2188
18	Track session. 6 sets of 400m 200R 200m 400R.	2019-05-09 19:44:01+00	6967	1882	0	(52.5200000000000031,-1.45999999999999996)	(52.5200000000000031,-1.45999999999999996)	f	169.899994	183	84	11	2355625881	1882
19	Morning Run	2019-05-08 06:48:47+00	10048	3057	47.0999985	(52.509999999999998,-1.42999999999999994)	(52.509999999999998,-1.42999999999999994)	f	156.5	172	81.6999969	6	2351356158	3012
\.


--
-- Data for Name: weather; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weather (id, strava_id, "timestamp", city, wind_speed, wind_direction, humidity, dew_point, pressure, snow, precipitation, temperature, cloud_coverage, solar_elevation, solar_azimuth, visibility, sea_level_pressure, uv) FROM stdin;
\.


--
-- Name: routes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.routes_id_seq', 11, true);


--
-- Name: runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.runs_id_seq', 19, true);


--
-- Name: weather_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weather_id_seq', 1, false);


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
-- Name: runs run_unique_strava_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT run_unique_strava_id UNIQUE (strava_id);


--
-- Name: runs runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_pkey PRIMARY KEY (id);


--
-- Name: weather weather_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weather
    ADD CONSTRAINT weather_pkey PRIMARY KEY (id);


--
-- Name: weather weather_unique_run_timestamp; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weather
    ADD CONSTRAINT weather_unique_run_timestamp UNIQUE (strava_id, "timestamp");


--
-- Name: fki_run_route_id_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_run_route_id_fkey ON public.runs USING btree (route_id);


--
-- Name: fki_weather_strava_id_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_weather_strava_id_fkey ON public.weather USING btree (strava_id);


--
-- Name: runs run_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT run_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: weather weather_run_strava_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weather
    ADD CONSTRAINT weather_run_strava_id_fkey FOREIGN KEY (strava_id) REFERENCES public.runs(strava_id);


--
-- PostgreSQL database dump complete
--

