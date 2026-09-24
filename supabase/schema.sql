-- Todo uygulaması şeması. Supabase > SQL Editor'da bir kez çalıştırın.
--
-- Notlar:
-- * created_at / updated_at / deleted_at istemcinin ürettiği ISO metinleridir
--   (toISOString, hep aynı biçim). Metin olarak saklanır ki istemci ile sunucu
--   aynı sıralamayı kullansın; timestamptz farklı biçimde geri döner.
-- * synced_at sunucu zamanıdır; cihazlar "şu andan sonra değişenleri ver" diye
--   bunu imleç olarak kullanır.
-- * Son yazan kazanır: daha eski updated_at ile gelen güncelleme yok sayılır (eşit olan kabul edilir;
--   istemci de eşitlikte sunucunun sürümünü alır).
-- * Birincil anahtar (user_id, id): her kullanıcının kendi "inbox" satırı olur ve aynı cihazda
--   başka bir hesaba geçmek çakışma yaratmaz. user_id istemciden gönderilmez, auth.uid() ile dolar.
-- * Bir liste silindiğinde görevleri tek tek silinmez; istemci, listesi silinmiş görevleri okurken gizler.

create table if not exists public.lists (
  id          text not null,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null,
  sort_order  bigint not null,
  created_at  text not null,
  updated_at  text not null,
  deleted_at  text,
  synced_at   timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.tasks (
  id          text not null,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  list_id     text not null,
  title       text not null,
  done        boolean not null default false,
  due_date    date,
  day_part    text check (day_part in ('morning', 'afternoon', 'evening')),
  sort_order  bigint not null,
  created_at  text not null,
  updated_at  text not null,
  deleted_at  text,
  synced_at   timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

-- Şema daha önce kurulduysa sonradan eklenen sütunlar
alter table public.tasks add column if not exists day_part text
  check (day_part in ('morning', 'afternoon', 'evening'));

-- Senkron sayfalaması (synced_at, id) sırasıyla okur.
create index if not exists lists_user_synced on public.lists (user_id, synced_at, id);
create index if not exists tasks_user_synced on public.tasks (user_id, synced_at, id);

-- Son yazan kazanır + senkron imlecini güncelle
create or replace function public.lww_guard() returns trigger
language plpgsql as $$
begin
  if new.updated_at < old.updated_at then
    return null; -- eski sürüm: güncellemeyi atla
  end if;
  new.user_id := old.user_id;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists lists_lww on public.lists;
create trigger lists_lww before update on public.lists
  for each row execute function public.lww_guard();

drop trigger if exists tasks_lww on public.tasks;
create trigger tasks_lww before update on public.tasks
  for each row execute function public.lww_guard();

-- Satır düzeyi güvenlik: herkes yalnızca kendi satırlarını görür/yazar
alter table public.lists enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "kendi listelerim" on public.lists;
create policy "kendi listelerim" on public.lists
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "kendi görevlerim" on public.tasks;
create policy "kendi görevlerim" on public.tasks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.lists, public.tasks to authenticated;
