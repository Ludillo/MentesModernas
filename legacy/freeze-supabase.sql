-- Applied only during the final cutover, after validating Firebase.
-- Prevents old browser sessions and Edge Functions from writing divergent data.
begin;
create or replace function public.mm_migrated_read_only() returns trigger
language plpgsql as $$ begin
  raise exception 'La plataforma fue actualizada. Recarga mentesmodernas.lat e ingresa nuevamente.';
end $$;
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('drop trigger if exists mm_firebase_cutover on public.%I',t.tablename);
    execute format('create trigger mm_firebase_cutover before insert or update or delete on public.%I for each statement execute function public.mm_migrated_read_only()',t.tablename);
  end loop;
end $$;
commit;
