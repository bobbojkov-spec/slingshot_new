-- One-time login codes for admin 2-step auth (local/testing)
create table if not exists public.admin_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  device_fingerprint text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz null
);

create index if not exists admin_login_codes_email_idx on public.admin_login_codes(email);
create index if not exists admin_login_codes_expires_idx on public.admin_login_codes(expires_at);

