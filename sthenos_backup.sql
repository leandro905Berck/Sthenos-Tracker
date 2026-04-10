--
-- PostgreSQL database dump
--

\restrict N3hwiRkdkPyRh1SYGs5B2y5Rr1xzR8DU7VC4eUFTx1YS78GGngT8WEadlVb5RZd

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercises (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    duration_minutes integer,
    sets integer,
    reps integer,
    weight_kg numeric(5,2),
    calories_burned numeric(7,2) NOT NULL,
    notes text,
    date date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id text
);


--
-- Name: exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exercises_id_seq OWNED BY public.exercises.id;


--
-- Name: meals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meals (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    calories_kcal numeric(7,2) NOT NULL,
    image_base64 text,
    ai_analyzed boolean DEFAULT false NOT NULL,
    date date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id text
);


--
-- Name: meals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: meals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meals_id_seq OWNED BY public.meals.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    name text NOT NULL,
    age integer,
    gender text,
    weight_kg numeric(5,2),
    height_cm numeric(5,2),
    goal text,
    activity_level text,
    bmi numeric(5,2),
    bmr numeric(7,2),
    tdee numeric(7,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id text
);


--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: weight_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weight_checks (
    id integer NOT NULL,
    weight_kg numeric(5,2) NOT NULL,
    date date NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id text
);


--
-- Name: weight_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.weight_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: weight_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.weight_checks_id_seq OWNED BY public.weight_checks.id;


--
-- Name: exercises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises ALTER COLUMN id SET DEFAULT nextval('public.exercises_id_seq'::regclass);


--
-- Name: meals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals ALTER COLUMN id SET DEFAULT nextval('public.meals_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: weight_checks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_checks ALTER COLUMN id SET DEFAULT nextval('public.weight_checks_id_seq'::regclass);


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exercises (id, name, type, duration_minutes, sets, reps, weight_kg, calories_burned, notes, date, created_at, user_id) FROM stdin;
2	Esteira	cardio	30	\N	\N	\N	200.00	\N	2026-04-03	2026-04-03 17:51:07.959899	\N
3	Supino reto	academia	45	3	10	\N	300.00	\N	2026-04-03	2026-04-03 17:58:43.711526	\N
4	Bicicleta Ergométrica	cardio	30	\N	\N	\N	240.00	\N	2026-04-03	2026-04-03 18:11:50.299558	\N
5	Crucifixo	academia	\N	3	20	\N	60.00	\N	2026-04-06	2026-04-06 21:03:42.076999	\N
7	Cadeira adutora	academia	45	3	10	\N	30.00	\N	2026-04-10	2026-04-10 04:01:55.367049	user_3C04V0B5xLPMQeEViuYVMK5wYv7
\.


--
-- Data for Name: meals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meals (id, name, category, description, calories_kcal, image_base64, ai_analyzed, date, created_at, user_id) FROM stdin;
2	Macarrão com frango	almoco		300.00	\N	f	2026-04-03	2026-04-03 17:51:27.025107	\N
3	cafe com leite	cafe		100.00	\N	f	2026-04-03	2026-04-03 17:58:15.246487	\N
4	Pão de forma com Peito de frango desfiado	lanche		200.00	\N	f	2026-04-03	2026-04-03 18:10:51.533739	\N
5	Arroz, feijão e carne moída	janta		200.00	\N	f	2026-04-06	2026-04-06 21:04:29.892944	\N
6	Café com Leite	cafe		50.00	\N	f	2026-04-06	2026-04-06 21:05:48.560989	\N
7	100g Arroz, 80g feijão e 100g de carne moída	janta	Porção padrão de 100g de arroz branco comum, 80g de feijão cozido e 100g de carne moída refogada.	450.00	\N	t	2026-04-06	2026-04-06 21:44:58.848737	\N
8	2 peitos de frango	almoco	2 peitos de frango grelhados, aproximadamente 200g cada	330.00	\N	t	2026-04-10	2026-04-10 03:52:29.826619	user_3C04V0B5xLPMQeEViuYVMK5wYv7
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, name, age, gender, weight_kg, height_cm, goal, activity_level, bmi, bmr, tdee, created_at, updated_at, user_id) FROM stdin;
1	Leandro Matheus Berck	26	masculino	87.00	175.00	perda de peso	sedentario	28.41	1838.75	2206.50	2026-04-03 17:40:12.773989	2026-04-03 18:00:30.626	\N
2	LEANDRO MATHEUS BERCK	25	masculino	70.00	170.00	manutenção	moderado	24.22	1642.50	2545.88	2026-04-10 03:50:03.278072	2026-04-10 03:50:03.276	user_3C04V0B5xLPMQeEViuYVMK5wYv7
\.


--
-- Data for Name: weight_checks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.weight_checks (id, weight_kg, date, notes, created_at, user_id) FROM stdin;
1	87.00	2026-04-03	\N	2026-04-03 17:39:53.203641	\N
2	89.00	2026-04-03	\N	2026-04-03 18:05:56.349738	\N
3	88.00	2026-04-06	\N	2026-04-06 21:02:28.070118	\N
5	98.00	2026-04-10	\N	2026-04-10 03:52:59.769371	user_3C04V0B5xLPMQeEViuYVMK5wYv7
\.


--
-- Name: exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exercises_id_seq', 7, true);


--
-- Name: meals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.meals_id_seq', 8, true);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profiles_id_seq', 2, true);


--
-- Name: weight_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.weight_checks_id_seq', 5, true);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: meals meals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: weight_checks weight_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_checks
    ADD CONSTRAINT weight_checks_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict N3hwiRkdkPyRh1SYGs5B2y5Rr1xzR8DU7VC4eUFTx1YS78GGngT8WEadlVb5RZd

