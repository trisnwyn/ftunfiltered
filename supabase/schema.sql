-- FTUnfiltered Database Schema
-- Run this in the Supabase SQL Editor to set up all tables and policies

-- ── Posts ────────────────────────────────────────────────────────────

create type post_type as enum ('confession', 'letter', 'shoutout', 'rant');
create type post_status as enum ('approved', 'pending', 'rejected');

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type post_type not null,
  content text not null check (char_length(content) between 1 and 2000),
  template text not null default 'minimal',
  styles jsonb not null default '{}',
  hearts_count int not null default 0,
  status post_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_posts_status_created on posts (status, created_at desc);
create index idx_posts_user on posts (user_id);
create index idx_posts_type on posts (type);

-- ── Post Photos ─────────────────────────────────────────────────────

create table post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_post_photos_post on post_photos (post_id);

-- ── Hearts ──────────────────────────────────────────────────────────

create table hearts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index idx_hearts_post on hearts (post_id);
create index idx_hearts_user on hearts (user_id);

-- ── Reports ─────────────────────────────────────────────────────────

create table reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index idx_reports_post on reports (post_id);

-- ── Admin Messages ──────────────────────────────────────────────────

create table admin_messages (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Hearts count trigger ────────────────────────────────────────────

create or replace function update_hearts_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set hearts_count = hearts_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update posts set hearts_count = hearts_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_heart_change
  after insert or delete on hearts
  for each row execute function update_hearts_count();

-- ── Row Level Security ──────────────────────────────────────────────

alter table posts enable row level security;
alter table post_photos enable row level security;
alter table hearts enable row level security;
alter table reports enable row level security;
alter table admin_messages enable row level security;

-- Posts: anyone can read approved posts, authors can insert/delete own
create policy "Anyone can read approved posts"
  on posts for select using (status = 'approved');

create policy "Authenticated users can create posts"
  on posts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete to authenticated
  using (auth.uid() = user_id);

-- Post photos: readable if post is approved, insertable by post author
create policy "Anyone can view photos of approved posts"
  on post_photos for select
  using (exists (
    select 1 from posts where posts.id = post_photos.post_id and posts.status = 'approved'
  ));

create policy "Authenticated users can upload photos"
  on post_photos for insert to authenticated
  with check (exists (
    select 1 from posts where posts.id = post_photos.post_id and posts.user_id = auth.uid()
  ));

-- Hearts: readable by all, insert/delete by authenticated
create policy "Anyone can read hearts"
  on hearts for select using (true);

create policy "Authenticated users can heart"
  on hearts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unheart"
  on hearts for delete to authenticated
  using (auth.uid() = user_id);

-- Reports: insertable by anyone authenticated
create policy "Authenticated users can report"
  on reports for insert to authenticated
  with check (true);

-- Admin messages: insertable by anyone (no auth needed for contact form)
create policy "Anyone can send admin messages"
  on admin_messages for insert
  with check (true);

-- ── Storage bucket for photos ───────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view post photos"
  on storage.objects for select
  using (bucket_id = 'post-photos');

create policy "Authenticated users can upload post photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-photos');

create policy "Users can delete own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);
