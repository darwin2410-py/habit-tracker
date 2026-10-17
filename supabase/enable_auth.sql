-- Run this in the Supabase SQL editor after you have signed up in the app.
-- Replace the email below with the one you signed up with.

-- 1. Move the existing data to your account
update habits      set user_id = (select id::text from auth.users where email = 'you@example.com') where user_id = 'user_default';
update completions set user_id = (select id::text from auth.users where email = 'you@example.com') where user_id = 'user_default';
update categories  set user_id = (select id::text from auth.users where email = 'you@example.com') where user_id = 'user_default';

-- 2. Only let each user read and write their own rows
alter table habits      enable row level security;
alter table completions enable row level security;
alter table categories  enable row level security;

drop policy if exists "own habits" on habits;
drop policy if exists "own completions" on completions;
drop policy if exists "own categories" on categories;

create policy "own habits" on habits for all to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
create policy "own completions" on completions for all to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
create policy "own categories" on categories for all to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
