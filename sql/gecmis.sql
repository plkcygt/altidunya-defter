-- =====================================================================
-- Altıdünya Parti Defteri — SÜRÜM GEÇMİŞİ (veri kaybına karşı sigorta)
-- Supabase → SQL Editor → yapıştır → Run  (bir kez)
-- Her güncellemede ESKİ değer saklanır; son 50 sürüm tutulur.
-- =====================================================================

create table if not exists public.kv_gecmis (
  id bigserial primary key,
  key text not null,
  value jsonb not null,
  kaydedildi timestamptz not null default now()
);

create index if not exists kv_gecmis_key_idx on public.kv_gecmis (key, kaydedildi desc);

alter table public.kv_gecmis enable row level security;

drop policy if exists "gecmis oku" on public.kv_gecmis;
create policy "gecmis oku" on public.kv_gecmis
  for select to authenticated using (true);

-- Güncellemeden ÖNCE eski değeri arşivle (son 50 sürüm kalır)
create or replace function public.kv_gecmis_yaz() returns trigger as $$
begin
  if old.value is distinct from new.value then
    insert into public.kv_gecmis(key, value) values (old.key, old.value);
    delete from public.kv_gecmis
     where id in (select id from public.kv_gecmis
                   where key = old.key
                   order by kaydedildi desc
                  offset 50);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists kv_gecmis_tr on public.kv;
create trigger kv_gecmis_tr before update on public.kv
  for each row execute function public.kv_gecmis_yaz();
