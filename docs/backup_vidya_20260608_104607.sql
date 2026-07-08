--
-- PostgreSQL database dump
--

\restrict mQLVhFjS3sNV6MZ3hi71DUI242R2juOSOee2TCJKPhGJegnAlLwWilXEXAwAmNJ

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
    "kodeSertifikat" text
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
    "dokSisyaPath" text
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
    "statusKelulusan" public."OverrideKelulusan" DEFAULT 'AUTO'::public."OverrideKelulusan" NOT NULL
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
\.


--
-- Data for Name: ProgramAjahan; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."ProgramAjahan" (id, kode, nama, deskripsi, "puniaNormal", "puniaPasangan", "isPasanganTersedia", "isAktif", urutan, "kodeSertifikat") FROM stdin;
1	KAWIKON	Kawikon	Program pendidikan disiapkan bagi para Sisya yang ingin melanjutkan perjalanan spiritual menuju jenjang Ratu Pedanda	1000000	1500000	t	t	0	KWN.IX-BD.SDM/PDPN
2	KAWELAKAAN	Kawelakaan	Program Pendidikan mendalami pengetahuan dan keterampilan sebagai Walaka	2000000	\N	f	t	0	WLK.XVIII-BD.SDM/PDPN
3	USADHA	Usadha	Program Pendidikan mempelajari dan melestarikan ilmu pengobatan tradisional Bali	1500000	\N	f	t	0	USH.III-BD.SDM/PDPN
4	SERATI	Serati	Program Pendidikan mendalami pengetahuan Panca Yadnya serta kemampuan praktis Keseratian	1000000	\N	f	t	0	SRT.IV-BD.SDM/PDPN
\.


--
-- Data for Name: ProsesiKelulusan; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."ProsesiKelulusan" (id, "sisyaId", "waktuHadir", "createdAt") FROM stdin;
\.


--
-- Data for Name: SesiAbsensi; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."SesiAbsensi" (id, "mataKuliahId", tanggal, pertemuan, topik, "createdAt", "dokNarawakPath", "dokPanitiaPath", "dokSisyaPath") FROM stdin;
\.


--
-- Data for Name: Sisya; Type: TABLE DATA; Schema: public; Owner: vidya_admin
--

COPY public."Sisya" (id, "nomorPendaftaran", "namaLengkap", "tempatLahir", "tanggalLahir", "jenisKelamin", alamat, "noHp", email, "namaGriya", "namaDesa", "totalPunia", "totalTerbayar", "statusPembayaran", "fileIdentitasPath", "fileFotoPath", "fileRekomendasiPath", status, "tanggalDiksan", "createdAt", "updatedAt", "statusKelulusan") FROM stdin;
17	PDPN-2026-0017	Ida Bagus Gede Subawa	Tabanan	2026-06-04 00:00:00	LAKI_LAKI	Br Kebayan. Desa Nyambu. Kec Kediri. Kab Tabanan	081382443652	\N	Griya Gede Bayuh	Kec. Kediri Tabanan	1500000	0	MENUNGGU_PEMBAYARAN	\N	/uploads/fileFoto-1780534277835-b56bc959.jpeg	/uploads/fileRekomendasi-1780534277835-7f6b3bfa.png	AKTIF	\N	2026-06-04 00:46:47.219	2026-06-04 00:56:40.554	AUTO
1	PDPN-2026-0001	IB Raka Surya Atmaja	Denpasar	1967-03-30 00:00:00	LAKI_LAKI	Jln. Pulau Roon No. 2 Dps	081999588745	jigus168@gmail.com	Griye Beraban Denpasar	Dauh Puri Kauh	1500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-05-03 21:35:20.641	2026-05-08 08:54:07.619	AUTO
6	PDPN-2026-0006	Anis Erressianti (Jero Puspa)	PROBOLINGGO	1967-08-03 00:00:00	PEREMPUAN	DSN. KAWAN ,DESA TUSAN, KEC.BANJARANGKAN,KLUNGKUNG	081339873916	erressianti@gmail.com	GRIYA TAMAN 	TUSAN	1000000	1000000	LUNAS	/uploads/fileIdentitas-1778142895583-bccb9be4.jpg	/uploads/fileFoto-1778142895584-92b887dd.jpeg	/uploads/fileRekomendasi-1778142895585-dc5ebad4.jpeg	AKTIF	\N	2026-05-06 04:37:02.707	2026-05-08 08:55:13.609	AUTO
4	PDPN-2026-0004	Ida Bagus Sudarsana	Badung	1969-09-19 00:00:00	LAKI_LAKI	Br Lambing Dusun Br Lambing Sibangkaja	082146558862	\N	Griya Suksuk Sibangkaja	Kabupaten Badung	1000000	1000000	LUNAS	/uploads/fileIdentitas-1777909107193-f651c433.png	/uploads/fileFoto-1777909107214-164c8959.jpg	/uploads/fileRekomendasi-1777909107219-bf528771.png	AKTIF	\N	2026-05-04 15:38:27.235	2026-05-05 07:36:00.636	AUTO
3	PDPN-2026-0003	Ida Ayu Mayun Mahendri	Sidemen	1969-10-21 00:00:00	PEREMPUAN	Br. Lambing Dusun. Br Lambing Sibang Kaja	082146558862	\N	Griya Suksuk Sibangkaja	Kabupaten Badung	1000000	1000000	LUNAS	/uploads/fileIdentitas-1777908812660-fbfc63cf.png	/uploads/fileFoto-1777908812677-3a4b8d65.jpg	/uploads/fileRekomendasi-1777908812688-108c9b1e.png	AKTIF	\N	2026-05-04 15:33:32.772	2026-05-05 07:36:20.012	AUTO
7	PDPN-2026-0007	Ida Ayu Komang Murtini	NEGARA	1964-11-11 00:00:00	PEREMPUAN	BUALU INDAH BLOK B-01, BENOA,KUTA SELATAN, BADUNG,BALI	082146591069		GRIYA TAMAN	TUSAN	1000000	1000000	LUNAS	/uploads/fileIdentitas-1778159427862-823e62dd.jpg	/uploads/fileFoto-1778249592742-4e0d0347.jpeg	/uploads/fileRekomendasi-1778159427870-051a172b.jpeg	AKTIF	\N	2026-05-06 06:29:29.315	2026-05-08 14:13:12.747	AUTO
5	PDPN-2026-0005	Ida Bagus Kade Asmara Jaya	Tabanan	1989-03-21 00:00:00	LAKI_LAKI	Banjar tunjuk kaja, desa tunjuk kec/kab tabanan	081246826586	bagusasmara60@gmail.com	Griya anyar tunjuk	Desa tunjuk	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1777941721318-53a74fcd.jpg	/uploads/fileFoto-1777941721346-273cd217.png	/uploads/fileRekomendasi-1777941721356-b45f475c.jpg	AKTIF	\N	2026-05-05 00:42:01.378	2026-05-05 08:54:17.883	AUTO
14	PDPN-2026-0014	Ida Bagus Made Ngurah Oka Dodo	Karangasem	1967-12-17 00:00:00	LAKI_LAKI	Griya gede muncan,karangasem	087761660687	\N	Griya Gede 	Desa Muncan, Kec. Selat	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780363827398-7cc0ed94.jpg	/uploads/fileFoto-1780363827450-7a210d80.jpg	\N	AKTIF	\N	2026-06-02 01:30:27.551	2026-06-02 01:52:21.537	AUTO
8	PDPN-2026-0008	Ida Bagus Surya Adi	Bangli	1978-11-12 00:00:00	LAKI_LAKI	Giriya Kawi Purna Timbul Gianyar	081558777909	gusurya1978sdsa17@giml.com	Giriya Kawi Purna Timbul Gianyar	Lingkungan Banjar Kelod Kauh Beng Gianyar jalan Murai No 5	5500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-05-09 14:53:52.985	2026-05-12 12:53:44.574	AUTO
9	PDPN-2026-0009	Ida Bagus Made Sutresna	Gianyar	1968-09-22 00:00:00	LAKI_LAKI	Br. Brahmana Bukit Bangli	081337679021	gussutresna@gmail.com	Geria Gede Br. Brahmana Bukit Bangli	Cempaga/Bangli	2000000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-05-12 12:41:36.018	2026-05-12 12:53:54.186	AUTO
11	PDPN-2026-0011	Ida Bagus Ketut Indrawan	Badung 	1963-07-31 00:00:00	LAKI_LAKI	Br. Keraman Ds Abiansemal Badung 	085102955252	idaindrawan17@guru.sma.belajar.id	Griya Kajeng Abiansemal 	Desa Abiansemal Badung 	1500000	1500000	LUNAS	/uploads/fileIdentitas-1779780740858-de6ebeca.jpg	/uploads/fileFoto-1779780961480-009134c1.jpeg	/uploads/fileRekomendasi-1779780741172-3783bf82.jpg	AKTIF	\N	2026-05-26 07:32:21.269	2026-05-26 07:36:01.485	AUTO
12	PDPN-2026-0012	Ida Bagus Ketut Indrawan	Badung 	1963-07-31 00:00:00	LAKI_LAKI	Br. Keraman Ds Abiansemal Badung 	085102955252	idaindrawan17@guru.sma.belajar.id	Griya Kajeng Abiansemal 	Desa Abiansemal Badung 	1500000	0	MENUNGGU_VERIFIKASI	/uploads/fileIdentitas-1779786861891-38710498.jpg	\N	\N	TIDAK_AKTIF	\N	2026-05-26 09:14:21.977	2026-05-31 13:01:09.798	AUTO
10	PDPN-2026-0010	Prof. Dr. Ida Bagus Ketut Surya, S.E., M.M.	Badung	1960-06-17 00:00:00	LAKI_LAKI	Griya Gede Taman-  Br. Tengah Desa Lukluk- Kecamatan Mengwi - Kabupaten Badung	081239607975	idabgssurya@unud.ac.id	Griya Gede Taman	Desa Lukluk/ Kecamatan Mengwi	1500000	1500000	LUNAS	/uploads/fileIdentitas-1778896536677-4a00fdbb.pdf	/uploads/fileFoto-1778896536687-ff6ec5a3.jpg	/uploads/fileRekomendasi-1778896536703-bd1e89d8.pdf	AKTIF	\N	2026-05-16 01:55:36.789	2026-05-17 16:45:52.418	AUTO
2	PDPN-2026-0002	Ida Bagus Gde Susila Adnyana	Yehembang, Negara	1976-12-25 00:00:00	LAKI_LAKI	Griya dangka, br bale agung, dan yehembang 	085923525330	\N	Griya dangka	Desa yehembang	1500000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	TIDAK_AKTIF	\N	2026-05-04 14:15:26.62	2026-05-31 13:02:08.951	AUTO
13	PDPN-2026-0013	Ida Bagus Gde Susila Adnyana	Yehembang, Negara	1976-12-25 00:00:00	LAKI_LAKI	Banjar Bale Agung, Ds Yehembang, Kec Mendoyo, Kab Jembrana	085923525330	\N	Griya Dangka	Desa Yehembang /Kec Mendoyo	1500000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1779788799063-d5854012.jpg	\N	\N	AKTIF	\N	2026-05-26 09:46:39.135	2026-05-31 13:02:16.135	AUTO
16	PDPN-2026-0016	Ida Bagus Gede Maha Putra, S.E.	Timpag	1968-01-12 00:00:00	LAKI_LAKI	Ds. Sri Bakti Kelurahan Negeri Bumi Putra Kecamatan Blambangan Umpu - Way Kanan Lampung	0822222222	\N	Gerya Manik	Lampung	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780531855977-bc6d95f6.png	\N	/uploads/fileRekomendasi-1780531856002-76b07e06.jpeg	PENDING	\N	2026-06-04 00:10:56.034	2026-06-04 00:10:56.034	AUTO
15	PDPN-2026-0015	Ida Bagus Komang Wijaya	Wanasari	1968-11-15 00:00:00	LAKI_LAKI	Br. Sandan Dauh Yeh Baleran Dusun Sandan, Dauh Yeh Baleran Kelurahan Sesandan Kecamatan Tabanan	0811111111	\N	Gerya Manik Br Sandan Dauh Yeh Baleran	Sesandan, Tabanan	1000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780531540351-d2396f6d.png	\N	/uploads/fileRekomendasi-1780531957398-5d528ba8.png	PENDING	\N	2026-06-04 00:05:40.422	2026-06-04 00:12:37.412	AUTO
18	PDPN-2026-0018	Ida Bagus Md. Ratu Karunia Utama	Sangeh	1996-01-22 00:00:00	LAKI_LAKI	Br. Pemijian Sangeh Abiansemal	087815142131	\N	Griya Denkayu	Sangeh	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780561658686-8c8d58c4.png	/uploads/fileFoto-1780561658725-0e136801.png	\N	AKTIF	\N	2026-06-04 08:27:38.872	2026-06-04 08:28:42.264	AUTO
19	PDPN-2026-0019	Ida Bagus Bumijaya	Sanur. Denpasar	1964-04-25 00:00:00	LAKI_LAKI	Jln Danau Beratan No.8 Sanur Denpasar	081236814458	gusbum@gmail.com	Griya Jumpung Sanur	Desa Sanur ,Kec.Denpasar Selatan, Dps.	2000000	0	MENUNGGU_PEMBAYARAN	\N	\N	\N	AKTIF	\N	2026-06-04 13:29:08.896	2026-06-08 02:24:12.281	AUTO
20	PDPN-2026-0020	Ida Bagus Putu Widiarta	Kupang	1987-02-01 00:00:00	LAKI_LAKI	Griya Kusara Kemenuh, Jembrana	081915788667	idabagusputuwidiarta1987@gmail.com	Griya Kusara Kemenuh	Desa Batuagung / Jembrana	2000000	0	MENUNGGU_PEMBAYARAN	/uploads/fileIdentitas-1780849715286-f50ecc28.jpg	\N	\N	AKTIF	\N	2026-06-07 16:28:35.569	2026-06-08 02:24:33.662	AUTO
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

SELECT pg_catalog.setval('public."Pembayaran_id_seq"', 8, true);


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

SELECT pg_catalog.setval('public."SisyaProgram_id_seq"', 23, true);


--
-- Name: Sisya_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vidya_admin
--

SELECT pg_catalog.setval('public."Sisya_id_seq"', 20, true);


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
-- PostgreSQL database dump complete
--

\unrestrict mQLVhFjS3sNV6MZ3hi71DUI242R2juOSOee2TCJKPhGJegnAlLwWilXEXAwAmNJ

