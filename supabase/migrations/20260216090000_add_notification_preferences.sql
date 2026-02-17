create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  order_updates_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy "notification preferences read own"
on notification_preferences
for select
using (auth.uid() = user_id);

create policy "notification preferences upsert own"
on notification_preferences
for insert
with check (auth.uid() = user_id);

create policy "notification preferences update own"
on notification_preferences
for update
using (auth.uid() = user_id);
