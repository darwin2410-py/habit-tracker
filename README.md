# Habit Tracker

Simple habit tracker built with React, Vite and Supabase. Installable as a PWA.

Features: daily and monthly view, custom frequency per habit, categories, streaks, dark mode, drag to reorder.

## Setup

```bash
npm install
```

Create `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Supabase tables used:

| Table | Columns |
| --- | --- |
| `habits` | `id`, `name`, `created_at`, `user_id`, `frequency` (json), `category_id`, `sort_order` |
| `completions` | `habit_id`, `date_key`, `user_id` |
| `categories` | `id`, `name`, `color`, `user_id` |

If your `habits` table was created before drag to reorder was added, run `supabase/add_sort_order.sql` in the Supabase SQL editor.

Login uses Supabase Auth (email and password). In Supabase, add your app URL under Authentication > URL Configuration. Then sign up in the app and run `supabase/enable_auth.sql` (with your email filled in) to move old data to your account and turn on row level security.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run lint
npm test        # run unit tests
```
