-- ============================================================
-- TS-ware-25 Supabase Schema
-- KAIC 의뢰 접수 시스템 (1차 접수 전용)
-- ============================================================

-- ============================================================
-- 1. profiles (사용자 프로필 + role 관리)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- 가입 시 profile 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. requests (의뢰 접수)
-- ============================================================
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,            -- KAIC-YY-###
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('test', 'consulting', 'development')),
  org_name text not null check (char_length(org_name) > 0),
  manager_name text not null check (char_length(manager_name) > 0),
  manager_phone text not null check (manager_phone ~ '^[0-9-]+$'),
  manager_email text not null check (manager_email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  title text not null check (char_length(title) > 0),
  description text not null check (char_length(description) >= 10),
  desired_start date not null,
  desired_end date not null,
  status text not null default 'new' check (status in ('new', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 날짜 범위 검증
  constraint date_range_check check (desired_start <= desired_end)
);

create index if not exists idx_requests_user_id on public.requests(user_id);
create index if not exists idx_requests_status on public.requests(status);
create index if not exists idx_requests_created_at on public.requests(created_at desc);
create index if not exists idx_requests_type on public.requests(request_type);

-- ============================================================
-- 3. receipt_no 자동 생성 (KAIC-YY-### 일련번호)
-- ============================================================
create sequence if not exists requests_seq_2026 start 1;

create or replace function public.generate_receipt_no()
returns trigger
language plpgsql
as $$
declare
  yy text;
  seq_name text;
  next_no bigint;
begin
  yy := to_char(now(), 'YY');
  seq_name := 'requests_seq_' || to_char(now(), 'YYYY');
  -- 연도별 시퀀스 동적 생성
  execute format('create sequence if not exists %I start 1', seq_name);
  execute format('select nextval(%L)', seq_name) into next_no;
  new.receipt_no := 'KAIC-' || yy || '-' || lpad(next_no::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists set_receipt_no on public.requests;
create trigger set_receipt_no
  before insert on public.requests
  for each row execute function public.generate_receipt_no();

-- ============================================================
-- 4. updated_at 자동 갱신
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. request_status_history (상태 변경 이력) [2년차 - UOp-5-S]
-- ============================================================
create table if not exists public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  prev_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists idx_status_history_request_id on public.request_status_history(request_id);
create index if not exists idx_status_history_changed_at on public.request_status_history(changed_at desc);

-- 상태 변경 시 자동 기록
create or replace function public.log_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.status is distinct from new.status then
    insert into public.request_status_history (request_id, prev_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists requests_log_status_change on public.requests;
create trigger requests_log_status_change
  after update on public.requests
  for each row execute function public.log_status_change();

-- ============================================================
-- 6. audit_log (감사 로그) [2년차 - SIn-2-G]
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  before_data jsonb,
  after_data jsonb,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists idx_audit_log_record_id on public.audit_log(record_id);
create index if not exists idx_audit_log_changed_at on public.audit_log(changed_at desc);

create or replace function public.audit_requests()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (table_name, record_id, action, after_data, changed_by)
    values ('requests', new.id, 'INSERT', to_jsonb(new), auth.uid());
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (table_name, record_id, action, before_data, after_data, changed_by)
    values ('requests', new.id, 'UPDATE', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (table_name, record_id, action, before_data, changed_by)
    values ('requests', old.id, 'DELETE', to_jsonb(old), auth.uid());
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists requests_audit on public.requests;
create trigger requests_audit
  after insert or update or delete on public.requests
  for each row execute function public.audit_requests();

-- ============================================================
-- 7. RLS (Row Level Security) [2년차 - SIn-2-G]
-- ============================================================
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.request_status_history enable row level security;
alter table public.audit_log enable row level security;

-- profiles: 본인만 조회, admin은 전체 조회
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- requests: 본인 신청만 읽기·쓰기
drop policy if exists "requests_select_own" on public.requests;
create policy "requests_select_own"
  on public.requests for select
  using (auth.uid() = user_id);

drop policy if exists "requests_insert_own" on public.requests;
create policy "requests_insert_own"
  on public.requests for insert
  with check (auth.uid() = user_id);

-- admin은 전체 조회·수정
drop policy if exists "requests_select_admin" on public.requests;
create policy "requests_select_admin"
  on public.requests for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "requests_update_admin" on public.requests;
create policy "requests_update_admin"
  on public.requests for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- request_status_history: 관련 의뢰의 소유자 또는 admin만 조회
drop policy if exists "status_history_select" on public.request_status_history;
create policy "status_history_select"
  on public.request_status_history for select
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_status_history.request_id
        and (r.user_id = auth.uid() or
             exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

-- audit_log: admin만 조회
drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin"
  on public.audit_log for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- 8. Realtime 활성화 [2년차 - UOp-5-S]
-- ============================================================
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.request_status_history;

-- ============================================================
-- 9. admin 계정 승격 헬퍼
-- 사용법: SQL Editor에서 본인 이메일로 한 번 실행
-- ============================================================
-- update public.profiles set role = 'admin' where email = 'your-admin@example.com';
