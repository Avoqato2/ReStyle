create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

alter table items enable row level security;

create policy "Users see only their own items"
on items for select
to authenticated
using ( auth.uid() = user_id );