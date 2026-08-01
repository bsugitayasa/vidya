--
-- PostgreSQL database dump
--

\restrict ywIIcdggxbFetgyxlzUx5nEqPDHCEYlXKamYxo98MyddtrB9p7BUQU3KkKi4PnJ

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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

--
-- Name: JenisKelamin; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."JenisKelamin" AS ENUM (
    'LAKI_LAKI',
    'PEREMPUAN'
);


ALTER TYPE public."JenisKelamin" OWNER TO vidya_admin;

--
-- Name: OverrideKelulusan; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."OverrideKelulusan" AS ENUM (
    'AUTO',
    'LULUS',
    'TIDAK_LULUS'
);


ALTER TYPE public."OverrideKelulusan" OWNER TO vidya_admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'STAFF',
    'SUPER_ADMIN'
);


ALTER TYPE public."Role" OWNER TO vidya_admin;

--
-- Name: StatusAbsensi; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."StatusAbsensi" AS ENUM (
    'HADIR',
    'IZIN',
    'SAKIT',
    'ALPHA'
);


ALTER TYPE public."StatusAbsensi" OWNER TO vidya_admin;

--
-- Name: StatusPembayaran; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."StatusPembayaran" AS ENUM (
    'MENUNGGU_PEMBAYARAN',
    'MENUNGGU_VERIFIKASI',
    'BELUM_LUNAS',
    'LUNAS',
    'DITOLAK'
);


ALTER TYPE public."StatusPembayaran" OWNER TO vidya_admin;

--
-- Name: StatusSisya; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."StatusSisya" AS ENUM (
    'PENDING',
    'AKTIF',
    'MEDIKSA',
    'TIDAK_AKTIF'
);


ALTER TYPE public."StatusSisya" OWNER TO vidya_admin;

--
-- Name: StatusVerifikasi; Type: TYPE; Schema: public; Owner: vidya_admin
--

CREATE TYPE public."StatusVerifikasi" AS ENUM (
    'MENUNGGU',
    'VERIFIKASI',
    'DITOLAK'
);


ALTER TYPE public."StatusVerifikasi" OWNER TO vidya_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AbsensiSisya; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."AbsensiSisya" (
    id integer NOT NULL,
    "sesiAbsensiId" integer NOT NULL,
    "sisyaId" integer NOT NULL,
    status public."StatusAbsensi" NOT NULL,
    keterangan text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AbsensiSisya" OWNER TO vidya_admin;

--
-- Name: AbsensiSisya_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."AbsensiSisya_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."AbsensiSisya_id_seq" OWNER TO vidya_admin;

--
-- Name: AbsensiSisya_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."AbsensiSisya_id_seq" OWNED BY public."AbsensiSisya".id;


--
-- Name: KonfigurasiAplikasi; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."KonfigurasiAplikasi" (
    id integer NOT NULL,
    kunci text NOT NULL,
    nilai text NOT NULL,
    label text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."KonfigurasiAplikasi" OWNER TO vidya_admin;

--
-- Name: KonfigurasiAplikasi_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."KonfigurasiAplikasi_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."KonfigurasiAplikasi_id_seq" OWNER TO vidya_admin;

--
-- Name: KonfigurasiAplikasi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."KonfigurasiAplikasi_id_seq" OWNED BY public."KonfigurasiAplikasi".id;


--
-- Name: MataKuliah; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."MataKuliah" (
    id integer NOT NULL,
    kode text NOT NULL,
    nama text NOT NULL,
    sks integer NOT NULL,
    semester integer NOT NULL,
    "programAjahanId" integer NOT NULL
);


ALTER TABLE public."MataKuliah" OWNER TO vidya_admin;

--
-- Name: MataKuliah_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."MataKuliah_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."MataKuliah_id_seq" OWNER TO vidya_admin;

--
-- Name: MataKuliah_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."MataKuliah_id_seq" OWNED BY public."MataKuliah".id;


--
-- Name: Pembayaran; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."Pembayaran" (
    id integer NOT NULL,
    "sisyaId" integer NOT NULL,
    nominal integer DEFAULT 0 NOT NULL,
    "buktiPath" text NOT NULL,
    status public."StatusVerifikasi" DEFAULT 'MENUNGGU'::public."StatusVerifikasi" NOT NULL,
    keterangan text,
    "tanggalBayar" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Pembayaran" OWNER TO vidya_admin;

--
-- Name: Pembayaran_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."Pembayaran_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Pembayaran_id_seq" OWNER TO vidya_admin;

--
-- Name: Pembayaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."Pembayaran_id_seq" OWNED BY public."Pembayaran".id;


--
-- Name: ProgramAjahan; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."ProgramAjahan" (
    id integer NOT NULL,
    kode text NOT NULL,
    nama text NOT NULL,
    deskripsi text,
    "puniaNormal" integer NOT NULL,
    "puniaPasangan" integer,
    "isPasanganTersedia" boolean DEFAULT false NOT NULL,
    "isAktif" boolean DEFAULT true NOT NULL,
    urutan integer DEFAULT 0 NOT NULL,
    "kodeSertifikat" text,
    "pinKoordinator" text
);


ALTER TABLE public."ProgramAjahan" OWNER TO vidya_admin;

--
-- Name: ProgramAjahan_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."ProgramAjahan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ProgramAjahan_id_seq" OWNER TO vidya_admin;

--
-- Name: ProgramAjahan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."ProgramAjahan_id_seq" OWNED BY public."ProgramAjahan".id;


--
-- Name: ProsesiKelulusan; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."ProsesiKelulusan" (
    id integer NOT NULL,
    "sisyaId" integer NOT NULL,
    "waktuHadir" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProsesiKelulusan" OWNER TO vidya_admin;

--
-- Name: ProsesiKelulusan_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."ProsesiKelulusan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ProsesiKelulusan_id_seq" OWNER TO vidya_admin;

--
-- Name: ProsesiKelulusan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."ProsesiKelulusan_id_seq" OWNED BY public."ProsesiKelulusan".id;


--
-- Name: SesiAbsensi; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."SesiAbsensi" (
    id integer NOT NULL,
    "mataKuliahId" integer NOT NULL,
    tanggal timestamp(3) without time zone NOT NULL,
    pertemuan integer NOT NULL,
    topik text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dokNarawakPath" text,
    "dokPanitiaPath" text,
    "dokSisyaPath" text,
    narawakya text
);


ALTER TABLE public."SesiAbsensi" OWNER TO vidya_admin;

--
-- Name: SesiAbsensi_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."SesiAbsensi_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SesiAbsensi_id_seq" OWNER TO vidya_admin;

--
-- Name: SesiAbsensi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."SesiAbsensi_id_seq" OWNED BY public."SesiAbsensi".id;


--
-- Name: Sisya; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."Sisya" (
    id integer NOT NULL,
    "nomorPendaftaran" text NOT NULL,
    "namaLengkap" text NOT NULL,
    "tempatLahir" text NOT NULL,
    "tanggalLahir" timestamp(3) without time zone NOT NULL,
    "jenisKelamin" public."JenisKelamin" NOT NULL,
    alamat text NOT NULL,
    "noHp" text NOT NULL,
    email text,
    "namaGriya" text NOT NULL,
    "namaDesa" text NOT NULL,
    "totalPunia" integer NOT NULL,
    "totalTerbayar" integer DEFAULT 0 NOT NULL,
    "statusPembayaran" public."StatusPembayaran" DEFAULT 'MENUNGGU_PEMBAYARAN'::public."StatusPembayaran" NOT NULL,
    "fileIdentitasPath" text,
    "fileFotoPath" text,
    "fileRekomendasiPath" text,
    status public."StatusSisya" DEFAULT 'PENDING'::public."StatusSisya" NOT NULL,
    "tanggalDiksan" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "statusKelulusan" public."OverrideKelulusan" DEFAULT 'AUTO'::public."OverrideKelulusan" NOT NULL,
    "partnerId" integer
);


ALTER TABLE public."Sisya" OWNER TO vidya_admin;

--
-- Name: SisyaProgram; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."SisyaProgram" (
    id integer NOT NULL,
    "sisyaId" integer NOT NULL,
    "programAjahanId" integer NOT NULL,
    "isPasangan" boolean DEFAULT false NOT NULL,
    "puniaProgram" integer NOT NULL,
    "nomorRegistrasi" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SisyaProgram" OWNER TO vidya_admin;

--
-- Name: SisyaProgram_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."SisyaProgram_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SisyaProgram_id_seq" OWNER TO vidya_admin;

--
-- Name: SisyaProgram_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."SisyaProgram_id_seq" OWNED BY public."SisyaProgram".id;


--
-- Name: Sisya_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."Sisya_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Sisya_id_seq" OWNER TO vidya_admin;

--
-- Name: Sisya_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."Sisya_id_seq" OWNED BY public."Sisya".id;


--
-- Name: TemplatePenandatangan; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."TemplatePenandatangan" (
    id integer NOT NULL,
    "namaTemplate" text NOT NULL,
    "namaPejabat" text NOT NULL,
    jabatan text NOT NULL,
    "namaPejabat2" text,
    jabatan2 text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TemplatePenandatangan" OWNER TO vidya_admin;

--
-- Name: TemplatePenandatangan_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."TemplatePenandatangan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."TemplatePenandatangan_id_seq" OWNER TO vidya_admin;

--
-- Name: TemplatePenandatangan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."TemplatePenandatangan_id_seq" OWNED BY public."TemplatePenandatangan".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    nama text NOT NULL,
    role public."Role" DEFAULT 'STAFF'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO vidya_admin;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: vidya_admin
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_id_seq" OWNER TO vidya_admin;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vidya_admin
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO vidya_admin;

--
-- Name: qr_document; Type: TABLE; Schema: public; Owner: vidya_admin
--

CREATE TABLE public.qr_document (
    id bigint NOT NULL,
    token character varying(100) NOT NULL,
    nomor_surat character varying(200) NOT NULL,
    keterangan_surat character varying(200) NOT NULL,
    tanggal date NOT NULL,
    nama_pejabat character varying(200) NOT NULL,
    jabatan character varying(200) NOT NULL,
    nama_pejabat_2 character varying(200),
    jabatan_2 character varying(200),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_by character varying(200),
    modified_at timestamp(3) without time zone
);


ALTER TABLE public.qr_document OWNER TO vidya_admin;

--
-- Name: AbsensiSisya id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."AbsensiSisya" ALTER COLUMN id SET DEFAULT nextval('public."AbsensiSisya_id_seq"'::regclass);


--
-- Name: KonfigurasiAplikasi id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."KonfigurasiAplikasi" ALTER COLUMN id SET DEFAULT nextval('public."KonfigurasiAplikasi_id_seq"'::regclass);


--
-- Name: MataKuliah id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."MataKuliah" ALTER COLUMN id SET DEFAULT nextval('public."MataKuliah_id_seq"'::regclass);


--
-- Name: Pembayaran id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."Pembayaran" ALTER COLUMN id SET DEFAULT nextval('public."Pembayaran_id_seq"'::regclass);


--
-- Name: ProgramAjahan id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."ProgramAjahan" ALTER COLUMN id SET DEFAULT nextval('public."ProgramAjahan_id_seq"'::regclass);


--
-- Name: ProsesiKelulusan id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."ProsesiKelulusan" ALTER COLUMN id SET DEFAULT nextval('public."ProsesiKelulusan_id_seq"'::regclass);


--
-- Name: SesiAbsensi id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SesiAbsensi" ALTER COLUMN id SET DEFAULT nextval('public."SesiAbsensi_id_seq"'::regclass);


--
-- Name: Sisya id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."Sisya" ALTER COLUMN id SET DEFAULT nextval('public."Sisya_id_seq"'::regclass);


--
-- Name: SisyaProgram id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SisyaProgram" ALTER COLUMN id SET DEFAULT nextval('public."SisyaProgram_id_seq"'::regclass);


--
-- Name: TemplatePenandatangan id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."TemplatePenandatangan" ALTER COLUMN id SET DEFAULT nextval('public."TemplatePenandatangan_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: AbsensiSisya; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."AbsensiSisya" (id, "sesiAbsensiId", "sisyaId", status, keterangan, "createdAt") FROM stdin;
\.


--
-- Data for Name: KonfigurasiAplikasi; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."KonfigurasiAplikasi" (id, kunci, nilai, label, "updatedAt") FROM stdin;
1	nama_bank	Bank BPD Bali	Nama Bank	2026-05-17 15:57:47.184
2	nomor_rekening	018.02.02.31507-5	Nomor Rekening	2026-05-17 15:57:47.184
3	nama_rekening	PDPN DIKJAR POLEKSOSDA	Nama Pemilik Rekening	2026-05-17 15:57:47.184
7	tanggal_kelulusan	2026-05-10	Tanggal Prosesi Kelulusan	2026-05-17 15:57:47.184
16	persentase_kelulusan	50	Persentase Minimum Kelulusan (%)	2026-05-17 15:57:47.184
22	admin_idle_timeout	5	Auto-logout timeout (menit)	2026-05-17 15:57:47.184
\.


--
-- Data for Name: MataKuliah; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."MataKuliah" (id, kode, nama, sks, semester, "programAjahanId") FROM stdin;
\.


--
-- Data for Name: Pembayaran; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."Pembayaran" (id, "sisyaId", nominal, "buktiPath", status, keterangan, "tanggalBayar", "verifiedAt", "createdAt") FROM stdin;
2	4	1000000	/uploads/filePunia-1777966513448-60c18607.png	VERIFIKASI	Pembayaran	2026-05-05 07:35:13.456	2026-05-05 07:36:00.629	2026-05-05 07:35:13.456
1	3	1000000	/uploads/filePunia-1777966501330-9f547ad8.png	VERIFIKASI	Pembayaran	2026-05-05 07:35:01.393	2026-05-05 07:36:20.009	2026-05-05 07:35:01.393
3	6	1000000	/uploads/filePunia-1778138658889-169072bc.jpeg	VERIFIKASI	Pembayaran	2026-05-07 07:24:18.967	2026-05-07 07:25:18.349	2026-05-07 07:24:18.967
4	7	1000000	/uploads/filePunia-1778138690582-1c3a5e1b.jpeg	VERIFIKASI	Pembayaran	2026-05-07 07:24:50.587	2026-05-07 07:25:44.129	2026-05-07 07:24:50.587
5	10	1500000	/uploads/filePunia-1778896536702-c1377973.jpeg	VERIFIKASI	Pembayaran	2026-05-16 01:55:36.789	2026-05-16 02:12:35.209	2026-05-16 01:55:36.789
7	11	0	/uploads/filePunia-1779780771363-b1eac6c0.jpg	MENUNGGU	Pembayaran cicilan	2026-05-26 07:32:51.522	\N	2026-05-26 07:32:51.522
6	11	1500000	/uploads/filePunia-1779780741058-fec462a6.jpg	VERIFIKASI	Pembayaran awal pendaftaran	2026-05-26 07:32:21.269	2026-05-26 07:34:46.292	2026-05-26 07:32:21.269
8	12	0	/uploads/filePunia-1779786861938-ba45fc3a.jpg	MENUNGGU	Pembayaran awal pendaftaran	2026-05-26 09:14:21.977	\N	2026-05-26 09:14:21.977
9	21	1000000	/uploads/filePunia-1780986524616-7210618b.jpeg	VERIFIKASI	Pembayaran Registrasi	2026-06-09 06:28:44.751	2026-06-09 06:29:42.783	2026-06-09 06:28:44.751
10	22	1000000	/uploads/filePunia-1780986536473-877a4eae.jpeg	VERIFIKASI	Pembayaran Registrasi	2026-06-09 06:28:56.476	2026-06-09 06:30:27.447	2026-06-09 06:28:56.476
12	29	1000000	/uploads/filePunia-1782561062040-e3a19c7d.jpg	VERIFIKASI	Pembayaran cicilan	2026-06-27 11:51:02.126	2026-06-27 12:12:02.867	2026-06-27 11:51:02.126
13	33	1000000	/uploads/filePunia-1782806736728-caf83da8.jpeg	VERIFIKASI	Pembayaran	2026-06-30 08:05:36.795	2026-06-30 08:09:35.485	2026-06-30 08:05:36.795
14	34	500000	/uploads/filePunia-1782905066607-e5410c11.jpeg	VERIFIKASI	DP Pendaftaran	2026-07-01 11:24:26.636	2026-07-01 11:25:08.458	2026-07-01 11:24:26.636
15	35	1000000	/uploads/filePunia-1782960739804-cc994c65.jpeg	VERIFIKASI	Pembayaran	2026-07-02 02:52:19.912	2026-07-02 02:54:23.501	2026-07-02 02:52:19.912
16	36	4500000	/uploads/filePunia-1783349910239-d12a04c9.jpg	VERIFIKASI	Pembayaran Punia (Serati, Usadha, Kawelakaan)	2026-07-06 14:58:30.422	2026-07-06 15:31:49.123	2026-07-06 14:58:30.422
18	23	1000000	/uploads/filePunia-1783523883807-c704e67b.jpeg	VERIFIKASI	Penauran Punia sareng Rabi	2026-07-08 15:18:03.81	2026-07-08 15:18:38.577	2026-07-08 15:18:03.81
17	24	1000000	/uploads/filePunia-1783523656449-58d9a806.jpeg	VERIFIKASI	Penauran Punia Usadha	2026-07-08 15:14:16.472	2026-07-08 15:18:49.783	2026-07-08 15:14:16.472
19	36	1000000	/uploads/filePunia-1783839505160-8a49d357.jpeg	VERIFIKASI	Penauran punia Kawikon	2026-07-12 06:58:25.308	2026-07-12 06:59:24.758	2026-07-12 06:58:25.308
20	48	1000000	/uploads/filePunia-1784471134686-08a9ff0d.jpeg	VERIFIKASI	Punia I	2026-07-19 14:25:34.71	2026-07-19 14:26:33.426	2026-07-19 14:25:34.71
21	49	2000000	/uploads/filePunia-1784510775376-f09a54a7.jpeg	VERIFIKASI	Punia Kawelakaan	2026-07-20 01:26:15.48	2026-07-20 01:26:48.886	2026-07-20 01:26:15.48
22	52	1000000	/uploads/filePunia-1784798815947-240e11c8.jpg	VERIFIKASI	Penauran Punia	2026-07-23 09:26:56.088	2026-07-23 09:30:55.197	2026-07-23 09:26:56.088
23	53	1000000	/uploads/filePunia-1784799601084-59d7f47a.jpg	VERIFIKASI	Pembayaran punia	2026-07-23 09:40:01.148	2026-07-23 14:39:12.319	2026-07-23 09:40:01.148
24	52	-500000	/uploads/filePunia-1784817588151-5976a2db.jpeg	VERIFIKASI	Pengembalian kelebihan bayar	2026-07-23 14:39:48.159	2026-07-23 14:39:56.596	2026-07-23 14:39:48.159
25	54	1000000	/uploads/filePunia-1784880556289-c6e6e83b.jpeg	VERIFIKASI	Penauran punia-1	2026-07-24 08:09:16.401	2026-07-24 09:09:05.408	2026-07-24 08:09:16.401
26	56	1000000	/uploads/filePunia-1784974897425-b6287a11.jpeg	VERIFIKASI	Punia Kawikon	2026-07-25 10:21:37.564	2026-07-27 13:59:51.947	2026-07-25 10:21:37.564
27	14	1000000	/uploads/filePunia-1785297403044-34731475.jpeg	VERIFIKASI	Penauran punia-1 Usadha	2026-07-29 03:56:43.184	2026-07-29 03:56:54.677	2026-07-29 03:56:43.184
28	62	1500000	/uploads/filePunia-1785303542319-6b834a02.jpeg	VERIFIKASI	Penauran Punia	2026-07-29 05:39:02.43	2026-07-29 05:39:41.781	2026-07-29 05:39:02.43
29	63	1000000	/uploads/filePunia-1785382695052-a4977ac0.jpeg	VERIFIKASI	Naur Kawikon IB Mahardika	2026-07-30 03:38:15.077	2026-07-30 03:38:23.347	2026-07-30 03:38:15.077
30	64	1000000	/uploads/filePunia-1785382804932-081c0f25.jpeg	VERIFIKASI	Naur Serati D. Ayu Maharini	2026-07-30 03:40:04.942	2026-07-30 03:40:10.557	2026-07-30 03:40:04.942
31	60	1000000	/uploads/filePunia-1785392824167-60b2c6a1.jpeg	VERIFIKASI	Penauran Serati & Kawelakaan Ib Putra Kaimana	2026-07-30 06:27:04.208	2026-07-30 06:27:11.252	2026-07-30 06:27:04.208
32	61	1000000	/uploads/filePunia-1785392910847-233c59ea.jpeg	VERIFIKASI	Punia Kawelakaan & Serati Ni Wayan Rianing (Jero Sandat)	2026-07-30 06:28:30.85	2026-07-30 06:28:37.944	2026-07-30 06:28:30.85
\.


--
-- Data for Name: ProgramAjahan; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."ProgramAjahan" (id, kode, nama, deskripsi, "puniaNormal", "puniaPasangan", "isPasanganTersedia", "isAktif", urutan, "kodeSertifikat", "pinKoordinator") FROM stdin;
1	KAWIKON	Kawikon	Program pendidikan disiapkan bagi para Sisya yang ingin melanjutkan perjalanan spiritual menuju jenjang Ratu Pedanda	1000000	1500000	t	t	0	KWN.IX-BD.SDM/PDPN	131313
2	KAWELAKAAN	Kawelakaan	Program Pendidikan mendalami pengetahuan dan keterampilan sebagai Walaka	2000000	\N	f	t	0	WLK.XVIII-BD.SDM/PDPN	131313
3	USADHA	Usadha	Program Pendidikan mempelajari dan melestarikan ilmu pengobatan tradisional Bali	1500000	\N	f	t	0	USH.III-BD.SDM/PDPN	131313
4	SERATI	Serati	Program Pendidikan mendalami pengetahuan Panca Yadnya serta kemampuan praktis Keseratian	1000000	\N	f	t	0	SRT.IV-BD.SDM/PDPN	131313
\.


--
-- Data for Name: ProsesiKelulusan; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."ProsesiKelulusan" (id, "sisyaId", "waktuHadir", "createdAt") FROM stdin;
\.


--
-- Data for Name: SesiAbsensi; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."SesiAbsensi" (id, "mataKuliahId", tanggal, pertemuan, topik, "createdAt", "dokNarawakPath", "dokPanitiaPath", "dokSisyaPath", narawakya) FROM stdin;
\.


--
-- Data for Name: Sisya; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."Sisya" (id, "nomorPendaftaran", "namaLengkap", "tempatLahir", "tanggalLahir", "jenisKelamin", alamat, "noHp", email, "namaGriya", "namaDesa", "totalPunia", "totalTerbayar", "statusPembayaran", "fileIdentitasPath", "fileFotoPath", "fileRekomendasiPath", status, "tanggalDiksan", "createdAt", "updatedAt", "statusKelulusan", "partnerId") FROM stdin;
17	PDPN-2026-0017	Ida Bagus Gede Subawa	Tabanan	2026-06-04 00:00:00	LAKI_LAKI	Br Kebayan. Desa Nyambu. Kec Kediri. Kab Tabanan	081382443652	\N	Griya Gede Bayuh	Kec. Kediri Tabanan	1500000	0	MENUNGGU_PEMBAYARAN	\N	/uploads/fileFoto-1780534277835-b56bc959.jpeg	/uploads/fileRekomendasi-1780534277835-7f6b3bfa.png	AKTIF	\N	2026-06-04 00:46:47.219	2026-06-04 00:56:40.554	AUTO	\N
1	PDPN-2026-0001	IB Raka Surya Atmaja	Denpasar	1967-03-30 00:00:00	LAKI_LAKI	Jln. Pulau Roon No. 2 Dps	081999588745	jigus168@gmail.com	Griye Beraban Denpasar	Dauh Puri Kauh	1500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-05-03 21:35:20.641	2026-05-08 08:54:07.619	AUTO	\N
6	PDPN-2026-0006	Anis Erressianti (Jero Puspa)	PROBOLINGGO	1967-08-03 00:00:00	PEREMPUAN	DSN. KAWAN ,DESA TUSAN, KEC.BANJARANGKAN,KLUNGKUNG	081339873916	erressianti@gmail.com	GRIYA TAMAN 	TUSAN	1000000	1000000	LUNAS	/uploads/fileIdentitas-1778142895583-bccb9be4.jpg	/uploads/fileFoto-1778142895584-92b887dd.jpeg	/uploads/fileRekomendasi-1778142895585-dc5ebad4.jpeg	AKTIF	\N	2026-05-06 04:37:02.707	2026-05-08 08:55:13.609	AUTO	\N
4	PDPN-2026-0004	Ida Bagus Sudarsana	Badung	1969-09-19 00:00:00	LAKI_LAKI	Br Lambing Dusun Br Lambing Sibangkaja	082146558862	\N	Griya Suksuk Sibangkaja	Kabupaten Badung	1000000	1000000	LUNAS	/uploads/fileIdentitas-1777909107193-f651c433.png	/uploads/fileFoto-1777909107214-164c8959.jpg	/uploads/fileRekomendasi-1777909107219-bf528771.png	AKTIF	\N	2026-05-04 15:38:27.235	2026-05-05 07:36:00.636	AUTO	\N
3	PDPN-2026-0003	Ida Ayu Mayun Mahendri	Sidemen	1969-10-21 00:00:00	PEREMPUAN	Br. Lambing Dusun. Br Lambing Sibang Kaja	082146558862	\N	Griya Suksuk Sibangkaja	Kabupaten Badung	1000000	1000000	LUNAS	/uploads/fileIdentitas-1777908812660-fbfc63cf.png	/uploads/fileFoto-1777908812677-3a4b8d65.jpg	/uploads/fileRekomendasi-1777908812688-108c9b1e.png	AKTIF	\N	2026-05-04 15:33:32.772	2026-05-05 07:36:20.012	AUTO	\N
7	PDPN-2026-0007	Ida Ayu Komang Murtini	NEGARA	1964-11-11 00:00:00	PEREMPUAN	BUALU INDAH BLOK B-01, BENOA,KUTA SELATAN, BADUNG,BALI	082146591069		GRIYA TAMAN	TUSAN	1000000	1000000	LUNAS	/uploads/fileIdentitas-1778159427862-823e62dd.jpg	/uploads/fileFoto-1778249592742-4e0d0347.jpeg	/uploads/fileRekomendasi-1778159427870-051a172b.jpeg	AKTIF	\N	2026-05-06 06:29:29.315	2026-05-08 14:13:12.747	AUTO	\N
5	PDPN-2026-0005	Ida Bagus Kade Asmara Jaya	Tabanan	1989-03-21 00:00:00	LAKI_LAKI	Banjar tunjuk kaja, desa tunjuk kec/kab tabanan	081246826586	bagusasmara60@gmail.com	Griya anyar tunjuk	Desa tunjuk	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1777941721318-53a74fcd.jpg	/uploads/fileFoto-1777941721346-273cd217.png	/uploads/fileRekomendasi-1777941721356-b45f475c.jpg	AKTIF	\N	2026-05-05 00:42:01.378	2026-05-05 08:54:17.883	AUTO	\N
14	PDPN-2026-0014	Ida Bagus Made Ngurah Oka Dodo	Karangasem	1967-12-17 00:00:00	LAKI_LAKI	Griya gede muncan,karangasem	087761660687	\N	Griya Gede 	Desa Muncan, Kec. Selat	1500000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1780363827398-7cc0ed94.jpg	/uploads/fileFoto-1780363827450-7a210d80.jpg	\N	AKTIF	\N	2026-06-02 01:30:27.551	2026-07-29 03:56:54.687	AUTO	\N
8	PDPN-2026-0008	Ida Bagus Surya Adi	Bangli	1978-11-12 00:00:00	LAKI_LAKI	Giriya Kawi Purna Timbul Gianyar	081558777909	gusurya1978sdsa17@giml.com	Giriya Kawi Purna Timbul Gianyar	Lingkungan Banjar Kelod Kauh Beng Gianyar jalan Murai No 5	5500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-05-09 14:53:52.985	2026-05-12 12:53:44.574	AUTO	\N
9	PDPN-2026-0009	Ida Bagus Made Sutresna	Gianyar	1968-09-22 00:00:00	LAKI_LAKI	Br. Brahmana Bukit Bangli	081337679021	gussutresna@gmail.com	Geria Gede Br. Brahmana Bukit Bangli	Cempaga/Bangli	2000000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-05-12 12:41:36.018	2026-05-12 12:53:54.186	AUTO	\N
11	PDPN-2026-0011	Ida Bagus Ketut Indrawan	Badung 	1963-07-31 00:00:00	LAKI_LAKI	Br. Keraman Ds Abiansemal Badung 	085102955252	idaindrawan17@guru.sma.belajar.id	Griya Kajeng Abiansemal 	Desa Abiansemal Badung 	1500000	1500000	LUNAS	/uploads/fileIdentitas-1779780740858-de6ebeca.jpg	/uploads/fileFoto-1779780961480-009134c1.jpeg	/uploads/fileRekomendasi-1779780741172-3783bf82.jpg	AKTIF	\N	2026-05-26 07:32:21.269	2026-05-26 07:36:01.485	AUTO	\N
12	PDPN-2026-0012	Ida Bagus Ketut Indrawan	Badung 	1963-07-31 00:00:00	LAKI_LAKI	Br. Keraman Ds Abiansemal Badung 	085102955252	idaindrawan17@guru.sma.belajar.id	Griya Kajeng Abiansemal 	Desa Abiansemal Badung 	1500000	0	MENUNGGU_VERIFIKASI	/uploads/fileIdentitas-1779786861891-38710498.jpg	\N	\N	TIDAK_AKTIF	\N	2026-05-26 09:14:21.977	2026-05-31 13:01:09.798	AUTO	\N
10	PDPN-2026-0010	Prof. Dr. Ida Bagus Ketut Surya, S.E., M.M.	Badung	1960-06-17 00:00:00	LAKI_LAKI	Griya Gede Taman-  Br. Tengah Desa Lukluk- Kecamatan Mengwi - Kabupaten Badung	081239607975	idabgssurya@unud.ac.id	Griya Gede Taman	Desa Lukluk/ Kecamatan Mengwi	1500000	1500000	LUNAS	/uploads/fileIdentitas-1778896536677-4a00fdbb.pdf	/uploads/fileFoto-1778896536687-ff6ec5a3.jpg	/uploads/fileRekomendasi-1778896536703-bd1e89d8.pdf	AKTIF	\N	2026-05-16 01:55:36.789	2026-05-17 16:45:52.418	AUTO	\N
2	PDPN-2026-0002	Ida Bagus Gde Susila Adnyana	Yehembang, Negara	1976-12-25 00:00:00	LAKI_LAKI	Griya dangka, br bale agung, dan yehembang 	085923525330	\N	Griya dangka	Desa yehembang	1500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	TIDAK_AKTIF	\N	2026-05-04 14:15:26.62	2026-05-31 13:02:08.951	AUTO	\N
13	PDPN-2026-0013	Ida Bagus Gde Susila Adnyana	Yehembang, Negara	1976-12-25 00:00:00	LAKI_LAKI	Banjar Bale Agung, Ds Yehembang, Kec Mendoyo, Kab Jembrana	085923525330	\N	Griya Dangka	Desa Yehembang /Kec Mendoyo	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1779788799063-d5854012.jpg	\N	\N	AKTIF	\N	2026-05-26 09:46:39.135	2026-05-31 13:02:16.135	AUTO	\N
18	PDPN-2026-0018	Ida Bagus Md. Ratu Karunia Utama	Sangeh	1996-01-22 00:00:00	LAKI_LAKI	Br. Pemijian Sangeh Abiansemal	087815142131	\N	Griya Denkayu	Sangeh	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780561658686-8c8d58c4.png	/uploads/fileFoto-1780561658725-0e136801.png	\N	AKTIF	\N	2026-06-04 08:27:38.872	2026-06-04 08:28:42.264	AUTO	\N
19	PDPN-2026-0019	Ida Bagus Bumijaya	Sanur. Denpasar	1964-04-25 00:00:00	LAKI_LAKI	Jln Danau Beratan No.8 Sanur Denpasar	081236814458	gusbum@gmail.com	Griya Jumpung Sanur	Desa Sanur ,Kec.Denpasar Selatan, Dps.	2000000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-06-04 13:29:08.896	2026-06-08 02:24:12.281	AUTO	\N
20	PDPN-2026-0020	Ida Bagus Putu Widiarta	Kupang	1987-02-01 00:00:00	LAKI_LAKI	Griya Kusara Kemenuh, Jembrana	081915788667	idabagusputuwidiarta1987@gmail.com	Griya Kusara Kemenuh	Desa Batuagung / Jembrana	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780849715286-f50ecc28.jpg	\N	\N	AKTIF	\N	2026-06-07 16:28:35.569	2026-06-08 02:24:33.662	AUTO	\N
15	PDPN-2026-0015	Ida Bagus Komang Wijaya	Wanasari	1968-11-15 00:00:00	LAKI_LAKI	Br. Sandan Dauh Yeh Baleran Dusun Sandan, Dauh Yeh Baleran Kelurahan Sesandan Kecamatan Tabanan	081337058834		Griya Manik Br Sandan Dauh Yeh Baleran	Sesandan, Tabanan	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780531540351-d2396f6d.png	\N	/uploads/fileRekomendasi-1780531957398-5d528ba8.png	AKTIF	\N	2026-06-04 00:05:40.422	2026-06-08 08:43:16.956	AUTO	\N
22	PDPN-2026-0022	Ida Ayu Gede Mayuni, S.E	Megati	1969-03-29 00:00:00	PEREMPUAN	Jln. Mayor Metra No. 26 Singaraja	081337530086	\N	Griya Upapathi Buleleng	Liligundi Buleleng	1000000	1000000	LUNAS	/uploads/fileIdentitas-1780986388567-372674af.jpeg	\N	/uploads/fileRekomendasi-1781866779005-85bdae26.jpeg	AKTIF	\N	2026-06-09 06:26:28.578	2026-06-19 10:59:39.015	AUTO	\N
21	PDPN-2026-0021	Ida Bagus Putu Permana Dwija Putra, S.H	Denpasar	1968-01-21 00:00:00	LAKI_LAKI	Jln. Mayor Metra No. 26 Singaraja	08123929653	\N	Griya Upapathi Buleleng	Liligundi Buleleng	1000000	1000000	LUNAS	/uploads/fileIdentitas-1780986242246-83244a7e.jpeg	\N	/uploads/fileRekomendasi-1781866623387-95c811ca.jpeg	AKTIF	\N	2026-06-09 06:24:02.373	2026-06-19 10:57:03.415	AUTO	\N
16	PDPN-2026-0016	Ida Bagus Gede Maha Putra, S.E.	Timpag	1968-01-12 00:00:00	LAKI_LAKI	Ds. Sri Bakti Kelurahan Negeri Bumi Putra Kecamatan Blambangan Umpu - Way Kanan Lampung	082177440098		Gerya Manik	Lampung	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780531855977-bc6d95f6.png	\N	/uploads/fileRekomendasi-1780531856002-76b07e06.jpeg	AKTIF	\N	2026-06-04 00:10:56.034	2026-06-27 12:17:45.017	AUTO	\N
32	PDPN-2026-0032	Ida Bagus Made Baskara	Gunung Biau	1978-12-31 00:00:00	LAKI_LAKI	Br Dinas Gunung Biau Muncan Selat Karangasem	087754426215	\N	Griya Muncan	Muncan, Selat Karangasem	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1782702174934-66aa6f3d.jpeg	\N	\N	AKTIF	\N	2026-06-29 03:02:54.971	2026-06-29 13:48:13.896	AUTO	\N
26	PDPN-2026-0026	Ir. Ida Bagus Putu Pertama Putra	Badung	1964-11-20 00:00:00	LAKI_LAKI	Perum Dewata Permai B2-14 Lingk Puseh Pengalasan Sading Mengwi	082145146535	\N	Griya Agung Kemenuh	Desa Sembung Mengwi Badung	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1782034067131-179c487b.jpeg	\N	\N	AKTIF	\N	2026-06-21 09:27:47.204	2026-06-21 09:34:38.732	AUTO	\N
31	PDPN-2026-0031	Ida Bagus Putu Sudira	Rendang	1973-12-07 00:00:00	LAKI_LAKI	Br. Dinas Geria Rendang	087857853011	\N	Griya Rendang	Rendang Karangasem	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1782702032379-74fa55e5.jpeg	\N	\N	AKTIF	\N	2026-06-29 03:00:32.398	2026-06-29 13:48:26.852	AUTO	\N
27	PDPN-2026-0027	Ida Bagus Putu Trisna Artha, S.E	Singaraja	1969-06-12 00:00:00	LAKI_LAKI	Br. Tauman, Sembung Mengwi Badung	081585895662		Griya Agung Kemenuh	Desa Sembung Mengwi Badung	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1782034192493-9160c1cb.jpeg	\N	\N	AKTIF	\N	2026-06-21 09:29:52.512	2026-06-21 09:47:36.101	AUTO	\N
25	PDPN-2026-0025	Ida Bagus Putu Artha, S.H., M.H	Klungkung	1966-07-01 00:00:00	LAKI_LAKI	Jl. Meduri No. 14 Denpasar Abian Kapas Denpasar Timur	081916725485		Griya Meduri	Denpasar	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1782018411656-d4d8cd8a.jpg	\N	\N	AKTIF	\N	2026-06-21 05:06:51.69	2026-06-21 09:56:15.959	AUTO	\N
30	PDPN-2026-0030	Ida Bagus Made Suryadi	Peringalot	1966-04-16 00:00:00	LAKI_LAKI	Br. Griya Rendang	085104399843	\N	Griya Rendang	Karangasem	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1782701907046-01b92914.jpeg	\N	\N	AKTIF	\N	2026-06-29 02:58:27.175	2026-06-29 13:48:35.848	AUTO	\N
28	PDPN-2026-0028	Ida Bagus Nyoman Oka	Pekutatan jemberana	1979-06-28 00:00:00	LAKI_LAKI	Perum dalung permai blok hh.38	081330991010	idabagusnyomanoka9@gmail.com	Griya banyupoh	Desa banyupoh,kec.gerokgak,kab.buleleng	2000000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-06-25 11:26:10.224	2026-06-27 11:56:22.158	AUTO	\N
29	PDPN-2026-0029	Ida Bagus Ketut Oka	Singaraja	1972-04-30 00:00:00	LAKI_LAKI	Jln Segara Madu no 15B Kelan Tuban	081337235884	idabagusketutoka5@gmail.com	Grya suci Dencarik	Banjar	2000000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1782561028348-fb1b07c4.jpg	/uploads/fileFoto-1782561028424-b8bc737f.jpg	/uploads/fileRekomendasi-1782561028504-3d560254.jpg	AKTIF	\N	2026-06-27 11:50:28.665	2026-06-27 12:15:08.027	AUTO	\N
23	PDPN-2026-0023	Ida Bagus Gede Ariadnyana	Singaraja	1980-02-07 00:00:00	LAKI_LAKI	Perumahan Grya Wahyu Indah Br.Gede Kel.Sempidi Kec.Mengwi Kab Badung	087889219991	\N	Griya Klod Kemenuh Desa Sawan	Kecamatan Sawan Kabupaten Buleleng	1500000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1781933431902-98be1bda.jpeg	\N	\N	AKTIF	\N	2026-06-20 05:30:32.031	2026-07-08 15:18:38.585	AUTO	\N
33	PDPN-2026-0033	Ida Bagus Sura Putra, S.PD	Karangasem	2966-12-29 00:00:00	LAKI_LAKI	Br. Dinas Gunung Biau, Muncan Selat Karangasem	087761682420		Griya Muncan	Selat Karangasem	1000000	1000000	LUNAS	/uploads/fileIdentitas-1782717929349-ad6b2d92.jpg	\N	\N	AKTIF	\N	2026-06-29 07:25:29.36	2026-06-30 08:09:35.493	AUTO	\N
40	PDPN-2026-0040	Ida Bagus Ketut Manuaba,s.pd.h	Tabanan	1963-12-06 00:00:00	LAKI_LAKI	Dusun/Br.Sandan Dauh Yeh Desa Sesandan,Kecamatan Tabanan,Kab.Tabanan.	081805381842	idabagusmanuaba31@gmail.com	Griya Naban Manuaba	Desa Sesandan/ Kec.Tabanan	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783111348765-b3ac9150.jpg	/uploads/fileFoto-1783111349006-2fac39e3.jpg	\N	TIDAK_AKTIF	\N	2026-07-03 20:42:29.026	2026-07-06 03:01:33.76	AUTO	\N
37	PDPN-2026-0037	Ida Bagus Gede Wardana, S.PD., M.PD	Bangli	1966-12-31 00:00:00	LAKI_LAKI	Br. Kelempung, Desa Jehem, Kec. Tembuku, Kab. Bangli-Bali	081239236100	idabagusgedewardana@gmail.com	Geria Kelempung	DEsa Jehem	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783051475581-8efc24c3.jpg	/uploads/fileFoto-1783051475654-1e406b74.jpg	\N	AKTIF	\N	2026-07-03 04:04:35.784	2026-07-03 04:26:40.804	AUTO	\N
35	PDPN-2026-0035	Ida Ayu Satwika Yadnya Santi	Denpasar	1990-12-18 00:00:00	PEREMPUAN	Jl. Diponegoro no. 55X	081916391286	idaayu.satwika@gmail.com	Griya Kediri Pekambingan	Desa Dauh Puri	1000000	1000000	LUNAS	/uploads/fileIdentitas-1782960739753-4ae67327.jpeg	/uploads/fileFoto-1782960739773-706cb47d.png	\N	AKTIF	\N	2026-07-02 02:52:19.912	2026-07-02 02:54:26.41	AUTO	\N
24	PDPN-2026-0024	Ni Made Riastini (Jro Dewi Gayatri)	Denpasar	1979-07-13 00:00:00	PEREMPUAN	Perumahan Grya Wahyu Indah Br.Gede Kel.Sempidi Kec.Mengwi Kab Badung	081937228118	\N	Griya Klod Kemenuh Desa Sawan	Kecamatan Sawan Kabupaten Buleleng	1500000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1781933532283-bba2e4bc.jpeg	\N	\N	AKTIF	\N	2026-06-20 05:32:12.307	2026-07-08 15:18:49.789	AUTO	\N
38	PDPN-2026-0038	Ida Bagus Surya Adi	Bangli	1978-12-11 00:00:00	LAKI_LAKI	Giriya Kawi Purna Timbul Gianyar\r\nJalan Murai no 5 Lingkungan banjar kelod kauh beng Gianyar	081558777909	gusurya1978sdsa17@giml.com	Giriya Kawi Purna Timbul Gianyar	Desa Beng / Kecamatan Gianyar	5500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	TIDAK_AKTIF	\N	2026-07-03 07:02:29.883	2026-07-03 13:46:24.898	AUTO	\N
41	PDPN-2026-0041	Ida Bagus Wisnu Adhi Putra	Kuta	1989-12-03 00:00:00	LAKI_LAKI	Jl. Purnawira VII No. 29 Pondok Purnama Padangsambian Kelod Denpasar Barat	087749850954	\N	Griya Gede Tanguwisia	Seririt Buleleng	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783321354339-b1334f65.jpeg	/uploads/fileFoto-1783321354360-0149780e.png	/uploads/fileRekomendasi-1783321354473-8cd1c274.png	AKTIF	\N	2026-07-06 07:02:34.728	2026-07-06 07:03:57.779	AUTO	\N
39	PDPN-2026-0039	Ida Bagus Ketut Manuaba, S.PD.H	Tabanan	1963-12-06 00:00:00	LAKI_LAKI	Dusun/Br.Sandan Dauh Yeh Desa Sesandan,Kecamatan Tabanan,Kab.Tabanan.	081805381842	idabagusmanuaba31@gmail.com	Griya Naban Manuaba	Desa Sesandan/ Kec.Tabanan	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783111285167-f00ea735.jpg	/uploads/fileFoto-1783111285226-c96160aa.jpg	\N	AKTIF	\N	2026-07-03 20:41:25.342	2026-07-06 03:01:59.378	AUTO	\N
34	PDPN-2026-0034	Ida Bagus Gede Sutisna Adiberata	Bangli	1970-12-23 00:00:00	LAKI_LAKI	Jl. Untung Surapati Subangan Karangasem	081338378402	\N	Griya Giri	Bangli	1000000	500000	BELUM_LUNAS	/uploads/fileIdentitas-1782903611622-03f0845c.jpeg	/uploads/fileFoto-1782910937761-322ef96a.jpg	/uploads/fileRekomendasi-1783404582696-acc67df8.jpeg	AKTIF	\N	2026-07-01 11:00:11.691	2026-07-07 06:10:13.302	AUTO	\N
36	PDPN-2026-0036	Ida Ayu Andikawati Manuaba	Badung	1969-11-29 00:00:00	PEREMPUAN	Geria Gde Kapal, Br. Celuk Kapal, Mengwi, Badung	081999532022	ikamanuaba@gmail.com	Griya Gde Kapal	Kapal, Mengwi	5500000	5500000	LUNAS	/uploads/fileIdentitas-1782963472320-40d30262.jpg	/uploads/fileFoto-1782963472322-a05698f0.jpg	\N	AKTIF	\N	2026-07-02 03:37:52.364	2026-07-12 06:59:24.767	AUTO	\N
42	PDPN-2026-0042	Ida Kade Ariya	Banjar	1964-04-06 00:00:00	LAKI_LAKI	Banajar Dinas Munduk	087864873709	\N	Griya Sabha Keniten	Banjar, Buleleng	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783570786597-eeccfef9.jpg	\N	\N	AKTIF	\N	2026-07-09 04:19:46.706	2026-07-09 10:11:16.592	AUTO	\N
43	PDPN-2026-0043	Ida Bagus Putu Wijawan	Br. Beng Marga	1974-02-22 00:00:00	LAKI_LAKI	Br. Dinas Beng Marga Tabanan	08123815042	\N	Griya Tengah Manuaba	Banjar, Marga Tabanan	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783839785241-2bb34828.jpeg	\N	\N	AKTIF	\N	2026-07-12 07:03:05.291	2026-07-12 07:07:43.166	AUTO	\N
44	PDPN-2026-0044	Ida Bagus Made Astawa	Karangasem	1962-12-31 00:00:00	LAKI_LAKI	BTN Tojan Blok C 10. Klungkung	081916795500		Griya Ulon Muncan	Kec. Selat Kabupaten Karangasem	3000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783903601011-a37c5e8b.jpeg	\N	\N	AKTIF	\N	2026-07-13 00:46:41.137	2026-07-13 02:47:58.387	AUTO	\N
45	PDPN-2026-0045	Ida Bagus Ketut Purwananta	Gianyar	1969-10-20 00:00:00	LAKI_LAKI	Br. Pande Pejeng Tampaksiring	081337327565	\N	Griya Pejeng	Tampaksiring, Gianyar	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1783913027033-eefe0446.jpg	\N	\N	AKTIF	\N	2026-07-13 03:23:47.064	2026-07-13 03:24:02.408	AUTO	\N
46	PDPN-2026-0046	Ida Bagus Pt Suastika, S.sos.,map	Kerobokan Badung	1966-02-08 00:00:00	LAKI_LAKI	Br. Dinas Waliang Abang	081339553111		Griya Tegeh Telaga	Kerobokan, Badung	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1784013598683-8c563444.jpeg	\N	\N	AKTIF	\N	2026-07-14 07:19:58.91	2026-07-16 05:37:11.516	AUTO	\N
47	PDPN-2026-0047	Ida Bagus Nyoman Parwata	Tihingan	1967-01-01 00:00:00	LAKI_LAKI	Dusun Tihingan Desa Tihingan Banjarangan Klungkung	08123818803	\N	Griya Tihingan	Banjarangkan, Klungkung	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1784180203611-6342a3e7.jpeg	\N	/uploads/fileRekomendasi-1784180203629-ab9a21b0.pdf	AKTIF	\N	2026-07-16 05:36:43.737	2026-07-16 05:37:17.4	AUTO	\N
52	PDPN-2026-0052	Ida Bagus Gede Juanida	Dawan Klod Klungkung	1966-06-03 00:00:00	LAKI_LAKI	Griya Dawan Klod, Br. Dinas Yeh malet, Desa Antiga Klod, Kecamatan Manggis, Kab. Karangasem.	085792435704	juanida3666@gmail.com	Griya Dawan Klod	Desa Antiga Klod, Kecamatan Manggis - Karangasem	1500000	1500000	LUNAS	/uploads/fileIdentitas-1784798815866-629fe9f1.jpg	/uploads/fileFoto-1784798815926-4227bf3a.jpg	/uploads/fileRekomendasi-1784798815968-47dd69a3.pdf	AKTIF	\N	2026-07-23 09:26:56.088	2026-07-23 14:39:56.603	AUTO	53
48	PDPN-2026-0048	Ida Bagus Anom Wibawa	Kapal	1986-06-12 00:00:00	LAKI_LAKI	Link. Uma Kapal Mengwi, Jl. Sandat No 22	085934454317	\N	Griya Uma Kapal	Mengwi Badung	2000000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1784471067789-195e66ad.jpeg	/uploads/fileFoto-1784471147882-48321873.jpg	\N	AKTIF	\N	2026-07-19 14:24:27.925	2026-07-19 14:32:18.055	AUTO	\N
49	PDPN-2026-0049	Ida Bagus AGUNG Sugianta	Denpasar	1963-03-14 00:00:00	LAKI_LAKI	Jl. Gunung Lawu No 11 Pemecutan Kelod Denpasar Barat	08123963065	\N	Griya Beji Tegal	Denpasar	2000000	2000000	LUNAS	/uploads/fileIdentitas-1784510775362-933eada8.jpeg	\N	\N	AKTIF	\N	2026-07-20 01:26:15.48	2026-07-20 01:26:57.239	AUTO	\N
50	PDPN-2026-0050	Ida Bagus Putu Merta	Pangiangan Kawan	1975-10-12 00:00:00	LAKI_LAKI	Banjar Selat Peken Selat, Susut Bangli	081353957227	\N	Griya Selat	Susut Bangli	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1784519827157-99f093d8.jpeg	\N	\N	AKTIF	\N	2026-07-20 03:57:07.285	2026-07-20 03:57:36.715	AUTO	\N
51	PDPN-2026-0051	Ida Bagus Sudiarta	Denpasar	1961-06-12 00:00:00	LAKI_LAKI	Br/Linkungan Padang Sumbu Kaja Denpasar Barata	087860583663		Griya Bangsing Padang Sumbu	Denpasar	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1784601681608-cba5908e.jpeg	/uploads/fileFoto-1784600840141-3a104e8f.jpeg	\N	AKTIF	\N	2026-07-21 02:27:20.248	2026-07-21 02:41:21.613	AUTO	\N
59	PDPN-2026-0059	Ida Bagus Surya Manuaba	Abiantuwung	1974-04-01 00:00:00	LAKI_LAKI	Jalan Ahmad Yani V no 10 Banjar Abiantuwung Kelod, Desa Abiantuwung, Kec Kediri, Kab Tabanan.	081239486789		Griya Kawi	Kecamatan Kediri, Tabanan	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1785201935394-066206c4.jpeg	/uploads/fileFoto-1785207928577-f6c217a3.jpg	\N	AKTIF	\N	2026-07-28 01:25:35.404	2026-07-28 03:05:28.605	AUTO	\N
53	PDPN-2026-0053	Ida Ayu Sri Werdiningsih	Denpasar	1970-11-25 00:00:00	PEREMPUAN	Griya Dawan Klod, Br. Dinas Yeh Malet, Desa Antiga Kelod, Kec. Manggis, Kab. Karangasem.	081999653800	srijuanida4498@gmail.com	Griya Dawan Klod	Desa Antiga Klod, Kecamatan Manggis - Karangasem	1500000	1500000	LUNAS	/uploads/fileIdentitas-1784799601074-f1586d1b.jpg	/uploads/fileFoto-1784799601082-bda7348f.jpg	/uploads/fileRekomendasi-1784799601086-d60f4518.pdf	AKTIF	\N	2026-07-23 09:40:01.148	2026-07-23 14:40:09.043	AUTO	\N
54	PDPN-2026-0054	Ida Bagus Mayun Giri Kesuma	Gianyar	1977-07-07 00:00:00	LAKI_LAKI	Jl. Raya Payangan NO : 141	081246528345	\N	Griya Cebaang Giri Kesuma	Desa Melinggih	2000000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1784862150643-efe38918.jpeg	/uploads/fileFoto-1784862150733-9fa4e839.jpeg	\N	AKTIF	\N	2026-07-24 03:02:30.842	2026-07-24 09:09:05.425	AUTO	\N
55	PDPN-2026-0055	I Dewa Ayu Ari Indrayani	Denpasar	1983-06-05 00:00:00	PEREMPUAN	Br. Sintrig Sibang Kaja, Abiansemal Badung	089527377066	\N	Griya Batan Bunut	Sibang Kaja, Badung	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1784896893654-de44afdf.jpeg	/uploads/fileFoto-1784896893677-0cf337bc.jpg	\N	AKTIF	\N	2026-07-24 12:41:33.826	2026-07-24 12:42:02.79	AUTO	\N
63	PDPN-2026-0063	Ida Bagus Komang Mahardika	Batuagung	1962-03-10 00:00:00	LAKI_LAKI	Banjar Taman Batuagung Jembrana	08123602486	\N	Griya Penida	Batuagung, Jembrana	1000000	1000000	LUNAS	/uploads/fileIdentitas-1785381493312-857b9324.jpeg	/uploads/fileFoto-1785381493372-d315177c.jpg	\N	AKTIF	\N	2026-07-30 03:18:13.471	2026-07-30 03:38:23.357	AUTO	\N
56	PDPN-2026-0056	Ida Bagus Gde Putra	Klungkung	1960-10-07 00:00:00	LAKI_LAKI	Perum Dalung Permai Blok G3 no.  8, Kerobokan Kaja, Kuta Utara, Badung, Bali 80361	08164714860	ibgputra07@gmail.com	Griya Kediri Kaleran	Kamasan Klungkung	1000000	1000000	LUNAS	/uploads/fileIdentitas-1784974897405-923e263d.jpeg	/uploads/fileFoto-1784974897417-6a9800e3.png	/uploads/fileRekomendasi-1784974897434-10831194.pdf	AKTIF	\N	2026-07-25 10:21:37.564	2026-07-27 13:59:56.193	AUTO	\N
57	PDPN-2026-0057	Ida Bagus Made Oka	Karangasem	1980-06-21 00:00:00	LAKI_LAKI	Jl patih nambi perum griyanambi permai2 no 11A	085237170949	gusokavw80@gmail.com	Griye kanginan sibetan	Desa sibetan kecamatan bebandem	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1785158092371-89c5963c.jpg	/uploads/fileFoto-1785158092499-5ea7cdfc.png	/uploads/fileRekomendasi-1785158092548-76b960a6.jpg	AKTIF	\N	2026-07-27 13:14:52.69	2026-07-27 14:00:12.529	AUTO	\N
58	PDPN-2026-0058	Ida Bagus Suwela Putra	Denpasar	1983-07-14 00:00:00	LAKI_LAKI	BR. PADANG SUMBU KAJA NO :278 PADANG SAMBIAN KELOD DENPASAR BARAT	085738860319	ibsuwela@gmail.com	Griya padang sumbu	Padang sambian kelod,/ Denpasar barat	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1785197864855-4fa45fe6.jpg	/uploads/fileFoto-1785197864961-edc6ce32.png	\N	AKTIF	\N	2026-07-28 00:17:45.128	2026-07-28 01:21:40.01	AUTO	\N
62	PDPN-2026-0062	Ida Bagus Made Oka	Karangasem	1980-06-21 00:00:00	LAKI_LAKI	Jl. Patih Nambi Perum Griyanambi Permai II 11A. Denpasar	085237170949	gusokavw@gmail.com	Griya Kanginan	Sibetan, Karangasem	1500000	1500000	LUNAS	/uploads/fileIdentitas-1785303542304-0629d5ec.jpeg	\N	/uploads/fileRekomendasi-1785303542321-8327ff30.jpeg	AKTIF	\N	2026-07-29 05:39:02.43	2026-07-29 05:39:45.553	AUTO	\N
64	PDPN-2026-0064	Dewa Ayu Ketut Maharini	Yehembang	1965-10-10 00:00:00	PEREMPUAN	Banjar Taman Batuagung Jembrana	081236033365	\N	Griya Penida	Batuagung, Jembrana	1000000	1000000	LUNAS	/uploads/fileIdentitas-1785381693907-bc6a984a.jpeg	/uploads/fileFoto-1785381693910-3f1d9eca.jpg	\N	AKTIF	\N	2026-07-30 03:21:33.947	2026-07-30 03:40:13.166	AUTO	\N
60	PDPN-2026-0060	Ni Wayan Rianing (Jero Sandat)	Denpasar	1968-12-28 00:00:00	PEREMPUAN	Griya Kauhan Br. Kebon Desa Blahbatuh	081337727163		Griya Kauhan	Br Kebon Blahbatuh, Gianyar	1000000	1000000	LUNAS	/uploads/fileIdentitas-1785216114413-7fa51614.jpeg	\N	\N	PENDING	\N	2026-07-28 05:21:54.557	2026-07-30 06:27:11.261	AUTO	\N
61	PDPN-2026-0061	Ida Bagus Putra Kaimana	Denpasar	1955-01-22 00:00:00	LAKI_LAKI	Griya Kauhan Br. Kebon Desa Blahbatuh.	081339083923	\N	Griya Kauhan	Br. Kebon Blahbatuh, Gianyar	2000000	1000000	BELUM_LUNAS	/uploads/fileIdentitas-1785216226519-4a7d95a9.jpeg	\N	\N	AKTIF	\N	2026-07-28 05:23:46.544	2026-07-30 06:28:37.951	AUTO	\N
\.


--
-- Data for Name: SisyaProgram; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."SisyaProgram" (id, "sisyaId", "programAjahanId", "isPasangan", "puniaProgram", "nomorRegistrasi", "createdAt") FROM stdin;
1	1	3	f	1500000	001/USH.III-BD.SDM/PDPN/V/2026	2026-05-03 21:35:20.641
2	2	3	f	1500000	002/USH.III-BD.SDM/PDPN/V/2026	2026-05-04 14:15:26.62
3	3	4	f	1000000	001/SRT.IV-BD.SDM/PDPN/V/2026	2026-05-04 15:33:32.772
4	4	1	f	1000000	001/KWN.IX-BD.SDM/PDPN/V/2026	2026-05-04 15:38:27.235
5	5	3	f	1500000	003/USH.III-BD.SDM/PDPN/V/2026	2026-05-05 00:42:01.378
6	6	4	f	1000000	002/SRT.IV-BD.SDM/PDPN/V/2026	2026-05-06 04:37:02.707
7	7	4	f	1000000	003/SRT.IV-BD.SDM/PDPN/V/2026	2026-05-06 06:29:29.315
8	8	1	f	1000000	002/KWN.IX-BD.SDM/PDPN/V/2026	2026-05-09 14:53:52.985
9	8	2	f	2000000	001/WLK.XVIII-BD.SDM/PDPN/V/2026	2026-05-09 14:53:52.985
10	8	3	f	1500000	004/USH.III-BD.SDM/PDPN/V/2026	2026-05-09 14:53:52.985
11	8	4	f	1000000	004/SRT.IV-BD.SDM/PDPN/V/2026	2026-05-09 14:53:52.985
12	9	2	f	2000000	002/WLK.XVIII-BD.SDM/PDPN/V/2026	2026-05-12 12:41:36.018
13	10	3	f	1500000	005/USH.III-BD.SDM/PDPN/V/2026	2026-05-16 01:55:36.789
14	11	3	f	1500000	006/USH.III-BD.SDM/PDPN/V/2026	2026-05-26 07:32:21.269
15	12	3	f	1500000	007/USH.III-BD.SDM/PDPN/V/2026	2026-05-26 09:14:21.977
16	13	3	f	1500000	008/USH.III-BD.SDM/PDPN/V/2026	2026-05-26 09:46:39.135
17	14	3	f	1500000	009/USH.III-BD.SDM/PDPN/VI/2026	2026-06-02 01:30:27.551
18	15	1	f	1000000	003/KWN.IX-BD.SDM/PDPN/VI/2026	2026-06-04 00:05:40.422
19	16	1	f	1000000	004/KWN.IX-BD.SDM/PDPN/VI/2026	2026-06-04 00:10:56.034
20	17	3	f	1500000	010/USH.III-BD.SDM/PDPN/VI/2026	2026-06-04 00:46:47.219
21	18	2	f	2000000	003/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-04 08:27:38.872
22	19	2	f	2000000	004/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-04 13:29:08.896
23	20	2	f	2000000	005/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-07 16:28:35.569
24	21	1	f	1000000	005/KWN.IX-BD.SDM/PDPN/VI/2026	2026-06-09 06:24:02.373
25	22	4	f	1000000	005/SRT.IV-BD.SDM/PDPN/VI/2026	2026-06-09 06:26:28.578
26	23	3	f	1500000	011/USH.III-BD.SDM/PDPN/VI/2026	2026-06-20 05:30:32.031
27	24	3	f	1500000	012/USH.III-BD.SDM/PDPN/VI/2026	2026-06-20 05:32:12.307
28	25	3	f	1500000	013/USH.III-BD.SDM/PDPN/VI/2026	2026-06-21 05:06:51.69
29	26	1	f	1000000	006/KWN.IX-BD.SDM/PDPN/VI/2026	2026-06-21 09:27:47.204
30	27	1	f	1000000	007/KWN.IX-BD.SDM/PDPN/VI/2026	2026-06-21 09:29:52.512
31	28	2	f	2000000	006/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-25 11:26:10.224
32	29	2	f	2000000	007/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-27 11:50:28.665
33	30	2	f	2000000	008/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-29 02:58:27.175
34	31	2	f	2000000	009/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-29 03:00:32.398
35	32	2	f	2000000	010/WLK.XVIII-BD.SDM/PDPN/VI/2026	2026-06-29 03:02:54.971
36	33	1	f	1000000	008/KWN.IX-BD.SDM/PDPN/VI/2026	2026-06-29 07:25:29.36
38	35	4	f	1000000	006/SRT.IV-BD.SDM/PDPN/VII/2026	2026-07-02 02:52:19.912
39	36	4	f	1000000	007/SRT.IV-BD.SDM/PDPN/VII/2026	2026-07-02 03:37:52.364
40	36	3	f	1500000	014/USH.III-BD.SDM/PDPN/VII/2026	2026-07-02 03:37:52.364
41	36	2	f	2000000	012/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-02 03:37:52.364
43	37	2	f	2000000	013/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-03 04:04:35.784
44	38	1	f	1000000	009/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-03 07:02:29.883
45	38	2	f	2000000	014/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-03 07:02:29.883
46	38	3	f	1500000	015/USH.III-BD.SDM/PDPN/VII/2026	2026-07-03 07:02:29.883
47	38	4	f	1000000	008/SRT.IV-BD.SDM/PDPN/VII/2026	2026-07-03 07:02:29.883
48	34	1	f	1000000	010/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-03 13:41:00.763
49	39	3	f	1500000	016/USH.III-BD.SDM/PDPN/VII/2026	2026-07-03 20:41:25.342
50	40	3	f	1500000	017/USH.III-BD.SDM/PDPN/VII/2026	2026-07-03 20:42:29.026
51	41	3	f	1500000	018/USH.III-BD.SDM/PDPN/VII/2026	2026-07-06 07:02:34.728
52	42	2	f	2000000	014/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-09 04:19:46.706
53	36	1	f	1000000	011/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-12 06:57:43.695
54	43	3	f	1500000	019/USH.III-BD.SDM/PDPN/VII/2026	2026-07-12 07:03:05.291
55	44	1	f	1000000	012/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-13 00:46:41.137
56	44	2	f	2000000	015/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-13 00:46:41.137
57	45	3	f	1500000	020/USH.III-BD.SDM/PDPN/VII/2026	2026-07-13 03:23:47.064
58	46	2	f	2000000	016/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-14 07:19:58.91
59	47	3	f	1500000	021/USH.III-BD.SDM/PDPN/VII/2026	2026-07-16 05:36:43.737
60	48	2	f	2000000	017/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-19 14:24:27.925
61	49	2	f	2000000	018/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-20 01:26:15.48
62	50	2	f	2000000	019/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-20 03:57:07.285
63	51	3	f	1500000	022/USH.III-BD.SDM/PDPN/VII/2026	2026-07-21 02:27:20.248
64	52	1	t	1500000	013/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-23 09:26:56.088
65	53	1	t	1500000	014/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-23 09:40:01.148
66	54	2	f	2000000	020/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-24 03:02:30.842
67	55	4	f	1000000	009/SRT.IV-BD.SDM/PDPN/VII/2026	2026-07-24 12:41:33.826
68	56	1	f	1000000	015/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-25 10:21:37.564
69	57	3	f	1500000	023/USH.III-BD.SDM/PDPN/VII/2026	2026-07-27 13:14:52.69
70	58	2	f	2000000	021/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-28 00:17:45.128
71	59	2	f	2000000	022/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-28 01:25:35.404
72	60	4	f	1000000	010/SRT.IV-BD.SDM/PDPN/VII/2026	2026-07-28 05:21:54.557
73	61	2	f	2000000	023/WLK.XVIII-BD.SDM/PDPN/VII/2026	2026-07-28 05:23:46.544
74	62	3	f	1500000	024/USH.III-BD.SDM/PDPN/VII/2026	2026-07-29 05:39:02.43
75	63	1	f	1000000	016/KWN.IX-BD.SDM/PDPN/VII/2026	2026-07-30 03:18:13.471
76	64	4	f	1000000	011/SRT.IV-BD.SDM/PDPN/VII/2026	2026-07-30 03:21:33.947
\.


--
-- Data for Name: TemplatePenandatangan; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."TemplatePenandatangan" (id, "namaTemplate", "namaPejabat", jabatan, "namaPejabat2", jabatan2, "createdAt", "updatedAt") FROM stdin;
1	Surat Antar Bidang - Ketum dan Sekum PDPN	Marsekal TNI (Purn) Ida Bagus Putu Dunia, Grad., Dipl., M.M.	Ketua Umum PDPN	Drs. Ida Bagus Arka	Sekretaris Umum PDPN	2026-05-20 09:20:54.759	2026-05-20 09:20:54.759
2	Surat Keputusan - Ketum PDPN	Marsekal TNI (Purn) Ida Bagus Putu Dunia, Grad., Dipl., M.M.	Ketua Umum PDPN	\N	\N	2026-05-20 09:22:22.508	2026-05-20 09:22:22.508
3	Surat SDM DIKJAR - Ketua SDM dan Kepala Seksi DIKJAR	Prof. Dr. Ida Bagus Purbawangsa, S.E., M.M	Ketua Bidang SDM	Dr. Ir. Ida Bagus Suardika, M.M., CODP	Kepala Seksi DIKJAR Kebrahmanan POLEKSOSDA	2026-05-20 09:26:26.992	2026-05-20 09:26:26.992
4	Surat DIKJAR - Kepala Seksi DIKJAR dan Sekretaris	Dr. Ir. Ida Bagus Suardika, M.M., CODP	Kepala Seksi DIKJAR Kebrahmanan POLEKSOSDA	Ir. Ida Bagus Gede Sugitayasa, S.T	Sekretaris Seksi DIKJAR Kebrahmanan POLEKSOSDA	2026-05-20 09:27:34.021	2026-05-20 09:27:34.021
5	Surat Bid. Pengkajian - Ketua Bidang dan Sekretaris	Ida Bagus Purwita Suamem, S.S., M.Si.	Ketua Bidang Pengkajian PDPN	Ida Bagus Pawanasuta, S.Pd., M.Pd.	Sekretaris Bidang Pengkajian PDPN	2026-05-28 12:35:05.847	2026-05-28 12:35:05.847
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."User" (id, email, password, nama, role, "createdAt") FROM stdin;
2	admin@pdpn.com	$2b$10$TB3h8GDEMsOWWvy81miZfOVs9MGCQ2OnxxGguGFQxkHuy9du4t2rm	Super Admin	SUPER_ADMIN	2026-05-06 08:00:31.542
1	admin.vidya@pdpn.com	$2b$10$87LEQ274LGvf0WAFOxE7xO3SsLECDX1pRckVOOeDnXUw8b2roC4ua	Administrator	ADMIN	2026-04-28 13:51:01.388
8	admin.kawikon@pdpn.com	$2b$10$Ej8dbvQXyKiQvTmWfF2zIenpdMynYCtiZutIYBDVwM1.vMJS62U/i	Koordinator Kawikon Dikjar Kebrahmanan POLEKSOSDA	ADMIN	2026-05-20 09:30:15.061
9	admin.kawalakaan@pdpn.com	$2b$10$7ABLtF84mD/7kOFpf7iqdu3upBOc9P3TE9QDtW9a.3iwj/duc4UD2	Koordinator Kawalakaan Dikjar Kebrahmanan POLEKSOSDA	ADMIN	2026-05-20 09:30:46.952
10	admin.usadha@pdpn.com	$2b$10$jRpbFucw2pvXCNGTqFwRj..eliuXarHq/20AYSE28h1LQM.Ilc0jW	Koordinator Usadha Dikjar Kebrahmanan POLEKSOSDA	ADMIN	2026-05-20 09:31:13.616
11	admin.serati@pdpn.com	$2b$10$QHkTh2Z0dOk9deBq.wT2N.s6aMXaJ1xwueVcxKClfbYch/hYH9jPW	Koordinator Serati Dikjar Kebrahmanan POLEKSOSDA	ADMIN	2026-05-20 09:31:40.351
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f8bdedd1-56c0-43fd-80e2-5f675695286a	8d276a3a7e8567865d132fea2661415a6b76642fdbbad01181cb4d79f9651936	2026-04-28 13:49:37.847595+00	20260428134937_init	\N	\N	2026-04-28 13:49:37.789688+00	1
\.


--
-- Data for Name: qr_document; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public.qr_document (id, token, nomor_surat, keterangan_surat, tanggal, nama_pejabat, jabatan, nama_pejabat_2, jabatan_2, created_at, modified_by, modified_at) FROM stdin;
1779112263556545	240EFCC5	03.029/PP.DPP-URSDM/PDPN/V/2026	Undangan Rapat Pasraman Dharma Wasitha Capung Mas	2026-05-13	Drs. Ida Bagus Arka	Sekretaris Umum	Prof. Dr. Ida Bagus Purbawangsa, S.E., M.M	Ketua Bidang SDM	2026-05-18 13:51:03.557	\N	\N
1779115598354511	F63CBE02	03.030/PP.DPP-PDSDM/PDPN/V/2026	Permohonan Dukungan Kegiatan Ajah-Ajahan Program Pendalaman Usadha	2026-05-19	Prof. Dr. Ida Bagus Purbawangsa, S.E., M.M	Ketua Bidang SDM	Dr. Ir. Ida Bagus Suardika, M.M., CODP	Kepala Seksi DIKJAR Kebrahmanan POLEKSOSDA	2026-05-18 14:46:38.355	\N	\N
1779159169261318	3DB60BBA	03.031/PP.DPP-SUSDM/PDPN/V/2026	Surat Undangan Pendampingan Kegiatan Pajah-Ajahan Program Pendalaman Usadha	2026-05-19	Dr. Ir. Ida Bagus Suardika, M.M., CODP	Kepala Seksi DIKJAR  Kebrahmanan POLEKSOSDA	Ir. Ida Bagus Gede Sugitayasa, S.T.	Sekretaris Seksi DIKJAR  Kebrahmanan POLEKSOSDA	2026-05-19 02:52:49.261	\N	\N
1779356582289222	91E6D8C3	03.032/PP.DPP-SPSDM/PDPN/V/2026	Permohonan Menjadi Narawakya/Pembimbing Program Pendalaman Usadha Dr. Drs. Ida Bagus Suatama, M.Si	2026-05-21	Prof. Dr. Ida Bagus Purbawangsa, S.E., M.M	Ketua Bidang SDM	Dr. Ir. Ida Bagus Suardika, M.M., CODP	Kepala Seksi DIKJAR Kebrahmanan POLEKSOSDA	2026-05-21 09:43:02.29	\N	\N
1779356639372755	2BEA76CF	03.033/PP.DPP-SPSDM/PDPN/V/2026	Permohonan Menjadi Narawakya/Pembimbing Program Pendalaman Usadha Ida Bagus Made Bhaskara	2026-05-21	Prof. Dr. Ida Bagus Purbawangsa, S.E., M.M	Ketua Bidang SDM	Dr. Ir. Ida Bagus Suardika, M.M., CODP	Kepala Seksi DIKJAR Kebrahmanan POLEKSOSDA	2026-05-21 09:43:59.373	\N	\N
1779971762612925	2A016931	035/PP.DPP-PSSG/PDPN/V/2026	Surat Uleman Pagepuksastra Sidhiguna 30 Mei 2026	2026-05-28	Ida Bagus Purwita Suamem, S.S., M.Si.	Ketua Bidang Pengkajian PDPN	Ida Bagus Pawanasuta, S.Pd., M.Pd.	Sekretaris Bidang Pengkajian PDPN	2026-05-28 12:36:02.614	\N	\N
1782177095943249	097A8BC8	040/PP.DPP-PSSG/PDPN/V/2026	Surat Uleman Pagepuksastra Sidhiguna 28 Juni 2026	2026-06-23	Ida Bagus Purwita Suamem, S.S., M.Si.	Ketua Bidang Pengkajian PDPN	Ida Bagus Pawanasuta, S.Pd., M.Pd.	Sekretaris Bidang Pengkajian PDPN	2026-06-23 01:11:35.945	\N	\N
1783950943996784	4E938E5D	045/PP.DPP-PSSG/PDPN/VII/2026	Surat Uleman Pagepuksastra Sidhiguna Saniscara 18 Juli 2026	2026-07-13	Ida Bagus Purwita Suamem, S.S., M.Si.	Ketua Bidang Pengkajian PDPN	Ida Bagus Pawanasuta, S.Pd., M.Pd.	Sekretaris Bidang Pengkajian PDPN	2026-07-13 13:55:43.998	\N	\N
\.


--
-- Name: AbsensiSisya_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."AbsensiSisya_id_seq"', 1, false);


--
-- Name: KonfigurasiAplikasi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."KonfigurasiAplikasi_id_seq"', 22, true);


--
-- Name: MataKuliah_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."MataKuliah_id_seq"', 1, true);


--
-- Name: Pembayaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."Pembayaran_id_seq"', 32, true);


--
-- Name: ProgramAjahan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."ProgramAjahan_id_seq"', 20, true);


--
-- Name: ProsesiKelulusan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."ProsesiKelulusan_id_seq"', 1, false);


--
-- Name: SesiAbsensi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."SesiAbsensi_id_seq"', 1, false);


--
-- Name: SisyaProgram_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."SisyaProgram_id_seq"', 76, true);


--
-- Name: Sisya_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."Sisya_id_seq"', 64, true);


--
-- Name: TemplatePenandatangan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."TemplatePenandatangan_id_seq"', 5, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."User_id_seq"', 11, true);


--
-- Name: AbsensiSisya AbsensiSisya_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."AbsensiSisya"
    ADD CONSTRAINT "AbsensiSisya_pkey" PRIMARY KEY (id);


--
-- Name: KonfigurasiAplikasi KonfigurasiAplikasi_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."KonfigurasiAplikasi"
    ADD CONSTRAINT "KonfigurasiAplikasi_pkey" PRIMARY KEY (id);


--
-- Name: MataKuliah MataKuliah_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."MataKuliah"
    ADD CONSTRAINT "MataKuliah_pkey" PRIMARY KEY (id);


--
-- Name: Pembayaran Pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."Pembayaran"
    ADD CONSTRAINT "Pembayaran_pkey" PRIMARY KEY (id);


--
-- Name: ProgramAjahan ProgramAjahan_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."ProgramAjahan"
    ADD CONSTRAINT "ProgramAjahan_pkey" PRIMARY KEY (id);


--
-- Name: ProsesiKelulusan ProsesiKelulusan_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."ProsesiKelulusan"
    ADD CONSTRAINT "ProsesiKelulusan_pkey" PRIMARY KEY (id);


--
-- Name: SesiAbsensi SesiAbsensi_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SesiAbsensi"
    ADD CONSTRAINT "SesiAbsensi_pkey" PRIMARY KEY (id);


--
-- Name: SisyaProgram SisyaProgram_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SisyaProgram"
    ADD CONSTRAINT "SisyaProgram_pkey" PRIMARY KEY (id);


--
-- Name: Sisya Sisya_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."Sisya"
    ADD CONSTRAINT "Sisya_pkey" PRIMARY KEY (id);


--
-- Name: TemplatePenandatangan TemplatePenandatangan_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."TemplatePenandatangan"
    ADD CONSTRAINT "TemplatePenandatangan_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: qr_document qr_document_pkey; Type: CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public.qr_document
    ADD CONSTRAINT qr_document_pkey PRIMARY KEY (id);


--
-- Name: AbsensiSisya_sesiAbsensiId_sisyaId_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "AbsensiSisya_sesiAbsensiId_sisyaId_key" ON public."AbsensiSisya" USING btree ("sesiAbsensiId", "sisyaId");


--
-- Name: KonfigurasiAplikasi_kunci_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "KonfigurasiAplikasi_kunci_key" ON public."KonfigurasiAplikasi" USING btree (kunci);


--
-- Name: MataKuliah_kode_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "MataKuliah_kode_key" ON public."MataKuliah" USING btree (kode);


--
-- Name: ProgramAjahan_kode_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "ProgramAjahan_kode_key" ON public."ProgramAjahan" USING btree (kode);


--
-- Name: ProsesiKelulusan_sisyaId_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "ProsesiKelulusan_sisyaId_key" ON public."ProsesiKelulusan" USING btree ("sisyaId");


--
-- Name: SisyaProgram_sisyaId_programAjahanId_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "SisyaProgram_sisyaId_programAjahanId_key" ON public."SisyaProgram" USING btree ("sisyaId", "programAjahanId");


--
-- Name: Sisya_nomorPendaftaran_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "Sisya_nomorPendaftaran_key" ON public."Sisya" USING btree ("nomorPendaftaran");


--
-- Name: Sisya_partnerId_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "Sisya_partnerId_key" ON public."Sisya" USING btree ("partnerId");


--
-- Name: TemplatePenandatangan_namaTemplate_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "TemplatePenandatangan_namaTemplate_key" ON public."TemplatePenandatangan" USING btree ("namaTemplate");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: qr_document_token_key; Type: INDEX; Schema: public; Owner: vidya_admin
--

CREATE UNIQUE INDEX qr_document_token_key ON public.qr_document USING btree (token);


--
-- Name: AbsensiSisya AbsensiSisya_sesiAbsensiId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."AbsensiSisya"
    ADD CONSTRAINT "AbsensiSisya_sesiAbsensiId_fkey" FOREIGN KEY ("sesiAbsensiId") REFERENCES public."SesiAbsensi"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AbsensiSisya AbsensiSisya_sisyaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."AbsensiSisya"
    ADD CONSTRAINT "AbsensiSisya_sisyaId_fkey" FOREIGN KEY ("sisyaId") REFERENCES public."Sisya"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MataKuliah MataKuliah_programAjahanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."MataKuliah"
    ADD CONSTRAINT "MataKuliah_programAjahanId_fkey" FOREIGN KEY ("programAjahanId") REFERENCES public."ProgramAjahan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pembayaran Pembayaran_sisyaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."Pembayaran"
    ADD CONSTRAINT "Pembayaran_sisyaId_fkey" FOREIGN KEY ("sisyaId") REFERENCES public."Sisya"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProsesiKelulusan ProsesiKelulusan_sisyaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."ProsesiKelulusan"
    ADD CONSTRAINT "ProsesiKelulusan_sisyaId_fkey" FOREIGN KEY ("sisyaId") REFERENCES public."Sisya"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SesiAbsensi SesiAbsensi_mataKuliahId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SesiAbsensi"
    ADD CONSTRAINT "SesiAbsensi_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES public."MataKuliah"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SisyaProgram SisyaProgram_programAjahanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SisyaProgram"
    ADD CONSTRAINT "SisyaProgram_programAjahanId_fkey" FOREIGN KEY ("programAjahanId") REFERENCES public."ProgramAjahan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SisyaProgram SisyaProgram_sisyaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."SisyaProgram"
    ADD CONSTRAINT "SisyaProgram_sisyaId_fkey" FOREIGN KEY ("sisyaId") REFERENCES public."Sisya"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sisya Sisya_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vidya_admin
--

ALTER TABLE ONLY public."Sisya"
    ADD CONSTRAINT "Sisya_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Sisya"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ywIIcdggxbFetgyxlzUx5nEqPDHCEYlXKamYxo98MyddtrB9p7BUQU3KkKi4PnJ

