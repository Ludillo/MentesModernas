-- Corrige la firma del RPC después de ampliar dimension_code a text.
drop function if exists public.get_active_test_questions(text);
create function public.get_active_test_questions(p_test_code text)
returns table(id uuid,test_version_id uuid,number integer,dimension_code text,prompt text,is_active boolean)
language plpgsql security definer set search_path=public as $$
declare v_version public.test_versions%rowtype;
begin
  select v.* into v_version from public.test_versions v where v.code=p_test_code and v.is_active=true limit 1;
  if v_version.id is null then raise exception 'Test no encontrado'; end if;
  if v_version.access_level='PREMIUM' then
    if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
    if not exists(select 1 from public.test_entitlements e join public.test_products p on p.id=e.product_id where e.user_id=auth.uid() and e.status='AVAILABLE' and p.test_version_id=v_version.id) then
      raise exception 'No existe un test Premium disponible';
    end if;
  end if;
  return query select q.id,q.test_version_id,q.number,q.dimension_code,q.prompt,q.is_active from public.test_questions q where q.test_version_id=v_version.id and q.is_active=true order by q.number;
end $$;
grant execute on function public.get_active_test_questions(text) to anon,authenticated;
