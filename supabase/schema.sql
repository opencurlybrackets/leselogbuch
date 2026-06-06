-- In Supabase: SQL Editor → New query → Run

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  author text not null,
  genre text not null default '',
  summary text not null default '',
  cover_image_url text not null default '',
  review text,
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  date_added timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists books_user_id_date_added_idx
  on public.books (user_id, date_added desc);

alter table public.books enable row level security;

create policy "books_select_own"
  on public.books for select
  using (auth.uid() = user_id);

create policy "books_insert_own"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "books_update_own"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "books_delete_own"
  on public.books for delete
  using (auth.uid() = user_id);
