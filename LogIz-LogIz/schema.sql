-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
create table if not exists public.users (
  id uuid references auth.users on delete cascade,
  primary key (id)
);

-- Safely add columns if they don't exist (Migration style)
alter table public.users add column if not exists name text;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists image text;
alter table public.users add column if not exists role text default 'USER';
alter table public.users add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;
alter table public.users add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Enable RLS
alter table public.users enable row level security;


-- ==========================================
-- 2. LOG FILES TABLE
-- ==========================================
create table if not exists public.log_files (
  id uuid default uuid_generate_v4() primary key,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add columns
alter table public.log_files add column if not exists filename text;
alter table public.log_files add column if not exists original_name text;
alter table public.log_files add column if not exists file_path text;
alter table public.log_files add column if not exists file_size bigint;
alter table public.log_files add column if not exists file_type text;
alter table public.log_files add column if not exists status text default 'PENDING';
-- Changing to text to match existing public.users table if it uses text ids
alter table public.log_files add column if not exists user_id text references public.users(id) on delete cascade;


-- ==========================================
-- 3. ANALYSES TABLE
-- ==========================================
create table if not exists public.analyses (
  id uuid default uuid_generate_v4() primary key,
  analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add columns
alter table public.analyses add column if not exists result jsonb;
alter table public.analyses add column if not exists threat_count int default 0;
alter table public.analyses add column if not exists high_severity int default 0;
alter table public.analyses add column if not exists medium_severity int default 0;
alter table public.analyses add column if not exists low_severity int default 0;
alter table public.analyses add column if not exists status text default 'PENDING';
alter table public.analyses add column if not exists processing_time int;
alter table public.analyses add column if not exists log_file_id uuid references public.log_files(id) on delete cascade;
-- Changing to text to match existing public.users table if it uses text ids
alter table public.analyses add column if not exists user_id text references public.users(id) on delete cascade;

-- Enable RLS and Policies
alter table public.log_files enable row level security;
alter table public.analyses enable row level security;
alter table public.threats enable row level security;

create policy "Users can view their own log files"
on public.log_files for select
using (auth.uid()::text = user_id);

create policy "Users can insert their own log files"
on public.log_files for insert
with check (auth.uid()::text = user_id);

create policy "Users can view their own analyses"
on public.analyses for select
using (auth.uid()::text = user_id);

create policy "Users can insert their own analyses"
on public.analyses for insert
with check (auth.uid()::text = user_id);

-- Threats RLS
create policy "Users can view threats of their analyses"
on public.threats for select
using ( exists ( select 1 from public.analyses where analyses.id = threats.analysis_id and analyses.user_id = auth.uid()::text ) );


-- ==========================================
-- 4. THREATS TABLE
-- ==========================================
create table if not exists public.threats (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

-- Safely add columns
alter table public.threats add column if not exists type text;
alter table public.threats add column if not exists severity text; -- CRITICAL, HIGH, MEDIUM, LOW, INFO
alter table public.threats add column if not exists description text;
alter table public.threats add column if not exists source_ip text;
alter table public.threats add column if not exists target_ip text;
alter table public.threats add column if not exists port int;
alter table public.threats add column if not exists raw_log text;
alter table public.threats add column if not exists confidence float;
alter table public.threats add column if not exists source_lat float;
alter table public.threats add column if not exists source_lon float;
alter table public.threats add column if not exists source_country text;
alter table public.threats add column if not exists analysis_id uuid references public.analyses(id) on delete cascade;


-- ==========================================
-- 5. INDEXES (Safe to run)
-- ==========================================
create index if not exists threats_analysis_id_idx on public.threats(analysis_id);
create index if not exists threats_severity_idx on public.threats(severity);
create index if not exists threats_type_idx on public.threats(type);
create index if not exists threats_timestamp_idx on public.threats(timestamp);


-- ==========================================
-- 6. API KEYS TABLE (Agent Authentication)
-- ==========================================
create table if not exists public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  name text default 'Default Agent Key',
  is_active boolean default true,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.api_keys enable row level security;

-- Policies
create policy "Users can view their own api keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own api keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own api keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- Index
create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_key_idx on public.api_keys(key);


-- ==========================================
-- 7. LIVE LOGS TABLE (Agent Data Storage)
-- ==========================================
create table if not exists public.live_logs (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamptz default now(),
  raw text not null,
  threat_type text,
  severity text,
  description text,
  source_ip text,
  username text,
  source text,
  user_id uuid references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.live_logs enable row level security;

-- Policies
create policy "Users can view their own live logs"
  on public.live_logs for select
  using (auth.uid() = user_id);

create policy "Insert live logs with valid api key"
  on public.live_logs for insert
  with check (true); -- API key validation done at application level

-- Index
create index if not exists live_logs_timestamp_idx on public.live_logs(timestamp);
create index if not exists live_logs_severity_idx on public.live_logs(severity);
