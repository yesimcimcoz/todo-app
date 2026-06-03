-- Kişisel kayıt + ortak liste modeli:
-- Her kullanıcı kendi e-posta/şifresiyle kaydolur, e-postasını onaylar.
-- Onaylanmış (giriş yapabilen) tüm kullanıcılar AYNI ortak listeyi görür/düzenler.
-- Anonim erişim kapalı kalır; yalnızca authenticated rolü erişebilir.
-- Not: e-posta onayı zorunlu olduğundan yalnızca onaylı kullanıcılar oturum
-- (authenticated token) alabilir; onaysız kullanıcılar erişemez.

-- Eski tek-hesap (UID kısıtlı) politikalarını kaldır
drop policy if exists "todos shared account" on public.todos;
drop policy if exists "steps shared account" on public.steps;

create policy "todos authenticated shared" on public.todos
  for all to authenticated
  using (true) with check (true);

create policy "steps authenticated shared" on public.steps
  for all to authenticated
  using (true) with check (true);
