-- Pagos QR verificables: cada solicitud pertenece a un usuario y producto,
-- y el acceso se concede únicamente después de una confirmación del proveedor.
alter table public.payments add column if not exists provider_transaction_id text;
alter table public.payments add column if not exists provider_qr_id text;
alter table public.payments add column if not exists qr_session_id uuid;
alter table public.payments add column if not exists provider_status text;
alter table public.payments add column if not exists provider_checked_at timestamptz;
alter table public.payments add column if not exists branch_code text default '01';

create unique index if not exists ux_payments_provider_transaction
  on public.payments(provider_transaction_id)
  where provider_transaction_id is not null;

create or replace function public.create_qr_payment(p_user_id uuid,p_product_code text)
returns table(payment_id uuid,session_id uuid,amount numeric,currency text,product_name text)
language plpgsql security definer set search_path=public as $$
declare p public.test_products%rowtype; pid uuid; sid uuid:=gen_random_uuid(); begin
  select * into p from public.test_products
  where code=upper(trim(p_product_code)) and access_level='PREMIUM' and is_active
  for share;
  if p.id is null then raise exception 'Producto avanzado no disponible'; end if;
  if p.price<=0 then raise exception 'El precio del test no está configurado'; end if;
  insert into public.payments(user_id,product_id,transaction_reference,amount,currency,status,qr_session_id,provider_status,branch_code)
  values(p_user_id,p.id,'QR-REQUEST-'||gen_random_uuid()::text,p.price,p.currency,'PENDING',sid,'CREATING','01')
  returning id into pid;
  return query select pid,sid,p.price,p.currency::text,p.name;
end $$;

create or replace function public.confirm_verified_qr_payment(p_user_id uuid,p_payment_id uuid,p_transaction_id text,p_qr_id text,p_provider_response jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare pay public.payments%rowtype; eid uuid; begin
  select * into pay from public.payments where id=p_payment_id and user_id=p_user_id for update;
  if pay.id is null then raise exception 'Solicitud de pago no encontrada'; end if;
  if pay.provider_transaction_id is distinct from p_transaction_id then raise exception 'La transacción no coincide con la solicitud'; end if;
  if pay.status='PAID' then
    select id into eid from public.test_entitlements where payment_id=pay.id limit 1;
    return eid;
  end if;
  if pay.status<>'PENDING' then raise exception 'La solicitud ya no está pendiente'; end if;
  update public.payments set status='PAID',paid_at=now(),provider_status='paid',provider_qr_id=coalesce(p_qr_id,provider_qr_id),provider_checked_at=now(),callback_response=p_provider_response where id=pay.id;
  insert into public.test_entitlements(user_id,product_id,payment_id,status)
  values(pay.user_id,pay.product_id,pay.id,'AVAILABLE')
  returning id into eid;
  return eid;
end $$;

create or replace function public.redeem_coupon_access(p_user_id uuid,p_product_code text,p_coupon_code text)
returns uuid language plpgsql security definer set search_path=public as $$
declare p public.test_products%rowtype; c public.coupons%rowtype; pid uuid; eid uuid; begin
  select * into p from public.test_products where code=upper(trim(p_product_code)) and access_level='PREMIUM' and is_active for share;
  if p.id is null then raise exception 'Producto avanzado no disponible'; end if;
  select * into c from public.coupons
  where upper(code)=upper(trim(p_coupon_code)) and is_active
    and valid_from<=now() and (valid_until is null or valid_until>now())
    and (product_id is null or product_id=p.id)
  for update;
  if c.id is null then raise exception 'Cupón inválido, vencido o no aplicable a este test'; end if;
  if c.max_uses is not null and c.uses_count>=c.max_uses then raise exception 'Este cupón ya fue utilizado'; end if;
  if exists(select 1 from public.coupon_redemptions where coupon_id=c.id and user_id=p_user_id) then raise exception 'Ya utilizaste este cupón'; end if;
  if c.discount_type<>'FREE' and not(c.discount_type='PERCENTAGE' and c.discount_value>=100) then raise exception 'El cupón no cubre el acceso completo'; end if;
  insert into public.payments(user_id,product_id,coupon_id,transaction_reference,amount,currency,status,paid_at,provider_status)
  values(p_user_id,p.id,c.id,'COUPON-'||gen_random_uuid()::text,0,p.currency,'PAID',now(),'coupon') returning id into pid;
  update public.coupons set uses_count=uses_count+1 where id=c.id;
  insert into public.coupon_redemptions(coupon_id,user_id,payment_id) values(c.id,p_user_id,pid);
  insert into public.test_entitlements(user_id,product_id,payment_id,status) values(p_user_id,p.id,pid,'AVAILABLE') returning id into eid;
  return eid;
end $$;

revoke all on function public.create_qr_payment(uuid,text) from public,anon,authenticated;
revoke all on function public.confirm_verified_qr_payment(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.redeem_coupon_access(uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_qr_payment(uuid,text) to service_role;
grant execute on function public.confirm_verified_qr_payment(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.redeem_coupon_access(uuid,text,text) to service_role;

-- Impide que el antiguo flujo de demostración pueda volver a otorgar accesos.
revoke all on function public.create_demo_entitlement(uuid,text,text) from service_role;
