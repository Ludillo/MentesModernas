-- Recovery only. Reconcile Firebase changes before reverting the public site.
begin;
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('drop trigger if exists mm_firebase_cutover on public.%I',t.tablename);
  end loop;
end $$;
drop function if exists public.mm_migrated_read_only();
commit;
