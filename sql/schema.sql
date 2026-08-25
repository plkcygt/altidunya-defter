-- =====================================================================
-- Altıdünya Parti Defteri — Supabase şeması
-- Supabase Dashboard → SQL Editor → yapıştır → Run
-- ÖNCE Authentication → Users'tan iki kullanıcı oluştur:
--   dm@altidunya.local     (şifre = SENİN DM şifren)
--   parti@altidunya.local  (şifre = ortak OYUNCU şifresi)
--   (Auto Confirm User işaretli olsun / e-posta onayı kapalı.)
-- =====================================================================

create table if not exists public.kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.kv enable row level security;

-- Herkes (giriş yapmış iki hesap) okur:
drop policy if exists "kv okuma" on public.kv;
create policy "kv okuma" on public.kv
  for select to authenticated using (true);

-- DM her anahtara yazar:
drop policy if exists "kv dm yaz" on public.kv;
create policy "kv dm yaz" on public.kv
  for all to authenticated
  using ( (auth.jwt() ->> 'email') = 'dm@altidunya.local' )
  with check ( (auth.jwt() ->> 'email') = 'dm@altidunya.local' );

-- Oyuncular karakter + parti kayıtlarına yazar (notlar YALNIZ DM):
drop policy if exists "kv oyuncu ekle" on public.kv;
create policy "kv oyuncu ekle" on public.kv
  for insert to authenticated
  with check ( (auth.jwt() ->> 'email') = 'parti@altidunya.local'
               and key in ('karakterler','parti') );

drop policy if exists "kv oyuncu guncelle" on public.kv;
create policy "kv oyuncu guncelle" on public.kv
  for update to authenticated
  using ( (auth.jwt() ->> 'email') = 'parti@altidunya.local'
          and key in ('karakterler','parti') )
  with check ( (auth.jwt() ->> 'email') = 'parti@altidunya.local'
               and key in ('karakterler','parti') );

-- updated_at otomatik tazelensin:
create or replace function public.kv_touch() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists kv_touch_tr on public.kv;
create trigger kv_touch_tr before update on public.kv
  for each row execute function public.kv_touch();
