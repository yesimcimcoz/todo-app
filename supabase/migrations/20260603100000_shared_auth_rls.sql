-- Ortak şifreli erişim:
-- Anonim erişimi kaldır, yalnızca ortak hesapla (sabit UID) giriş yapılmışsa
-- okuma/yazma izni ver. Böylece publishable anahtar tek başına işe yaramaz;
-- veriye erişmek için ortak şifreyle giriş yapmak zorunludur.

-- Eski izin verici (anon dahil) politikaları kaldır
drop policy if exists "todos anon full access" on public.todos;
drop policy if exists "steps anon full access" on public.steps;

-- Yalnızca ortak hesap (3cbaf6ea-...) erişebilir
create policy "todos shared account" on public.todos
  for all to authenticated
  using (auth.uid() = '3cbaf6ea-a1a9-4cf8-a2de-23bf73d96a42'::uuid)
  with check (auth.uid() = '3cbaf6ea-a1a9-4cf8-a2de-23bf73d96a42'::uuid);

create policy "steps shared account" on public.steps
  for all to authenticated
  using (auth.uid() = '3cbaf6ea-a1a9-4cf8-a2de-23bf73d96a42'::uuid)
  with check (auth.uid() = '3cbaf6ea-a1a9-4cf8-a2de-23bf73d96a42'::uuid);
