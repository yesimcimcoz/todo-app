-- Yapılacaklar uygulaması şeması
-- Görevler ve onlara bağlı uygulama adımları

create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  due_date    date,
  assignee    text,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.steps (
  id          uuid primary key default gen_random_uuid(),
  todo_id     uuid not null references public.todos (id) on delete cascade,
  text        text not null,
  due_date    date,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists steps_todo_id_idx on public.steps (todo_id);

-- RLS'i etkinleştir. Bu uygulama kimlik doğrulama kullanmadığından
-- (yalnızca publishable/anon anahtarı), anon ve authenticated rollerine
-- tam erişim veren izin verici politikalar tanımlıyoruz.
alter table public.todos enable row level security;
alter table public.steps enable row level security;

drop policy if exists "todos anon full access" on public.todos;
create policy "todos anon full access" on public.todos
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "steps anon full access" on public.steps;
create policy "steps anon full access" on public.steps
  for all to anon, authenticated
  using (true) with check (true);
