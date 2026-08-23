-- Plataforma profesional: catálogo completo, pagos verificables y administración parametrizable.
alter table public.test_types add column if not exists icon text not null default '🧠';
alter table public.test_types add column if not exists sort_order integer not null default 0;
alter table public.test_versions add column if not exists instructions text;
alter table public.test_versions add column if not exists result_labels jsonb not null default '{}'::jsonb;
alter table public.test_questions alter column dimension_code type text;
alter table public.test_questions add column if not exists weight numeric(8,2) not null default 1;
alter table public.payments add column if not exists receipt_url text;
alter table public.payments add column if not exists payer_name text;
alter table public.payments add column if not exists payer_reference text;
alter table public.payments add column if not exists reviewed_at timestamptz;
alter table public.payments add column if not exists reviewed_by uuid references public.admin_users(id);
alter table public.test_entitlements alter column payment_id drop not null;

insert into public.site_content(key,value) values
('payment_settings','{"bank_name":"Configurar desde administración","account_name":"MentesModernas","account_number":"","qr_url":"","instructions":"Escanea el QR, realiza el pago y adjunta tu comprobante."}'),
('site_settings','{"support_email":"","whatsapp":"","default_theme":"dark","maintenance":false}')
on conflict(key) do nothing;

update public.test_types set status='ACTIVE', icon=case code when 'VOCATIONAL' then '🧭' when 'LEARNING_STYLE' then '📚' else '💪' end,
 sort_order=case code when 'VOCATIONAL' then 1 when 'LEARNING_STYLE' then 2 else 3 end
where code in ('VOCATIONAL','LEARNING_STYLE','PERSONAL_STRENGTHS');

insert into public.test_versions(id,test_type_id,code,version,access_level,question_count,scoring_model,is_active) values
('33333333-3333-4333-8333-333333333333','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','LEARNING_STYLE_FREE','1.0','FREE',12,'DIMENSION_SUM',true),
('44444444-4444-4444-8444-444444444444','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','LEARNING_STYLE_PREMIUM','1.0','PREMIUM',24,'DIMENSION_SUM',true),
('55555555-5555-4555-8555-555555555555','cccccccc-cccc-4ccc-8ccc-cccccccccccc','PERSONAL_STRENGTHS_FREE','1.0','FREE',12,'DIMENSION_SUM',true),
('66666666-6666-4666-8666-666666666666','cccccccc-cccc-4ccc-8ccc-cccccccccccc','PERSONAL_STRENGTHS_PREMIUM','1.0','PREMIUM',24,'DIMENSION_SUM',true)
on conflict(code) do update set question_count=excluded.question_count,is_active=true;

insert into public.test_products(code,test_type_id,test_version_id,name,access_level,price,currency,is_active) values
('LEARNING_STYLE_FREE','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','Estilo de Aprendizaje Gratis','FREE',0,'BOB',true),
('LEARNING_STYLE_PREMIUM','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444','Estilo de Aprendizaje Avanzado','PREMIUM',40,'BOB',true),
('PERSONAL_STRENGTHS_FREE','cccccccc-cccc-4ccc-8ccc-cccccccccccc','55555555-5555-4555-8555-555555555555','Fortalezas Personales Gratis','FREE',0,'BOB',true),
('PERSONAL_STRENGTHS_PREMIUM','cccccccc-cccc-4ccc-8ccc-cccccccccccc','66666666-6666-4666-8666-666666666666','Fortalezas Personales Avanzado','PREMIUM',40,'BOB',true)
on conflict(code) do update set price=excluded.price,is_active=true;

-- Bancos compactos de preguntas; la versión avanzada siempre contiene más ítems.
do $$ declare v record; dims text[]; prompts text[]; i int; begin
  for v in select id,code,question_count from public.test_versions where code in ('LEARNING_STYLE_FREE','LEARNING_STYLE_PREMIUM') loop
    dims:=array['VISUAL','AUDITORY','READING','KINESTHETIC'];
    prompts:=array['Comprendo mejor cuando observo diagramas o demostraciones.','Recuerdo con facilidad una explicación escuchada.','Aprendo organizando ideas en apuntes y resúmenes.','Necesito practicar para comprender realmente un tema.','Los mapas conceptuales me ayudan a conectar ideas.','Explicar un tema en voz alta mejora mi comprensión.','Prefiero instrucciones escritas y ordenadas.','Los ejemplos y ejercicios reales mantienen mi atención.'];
    delete from public.test_questions where test_version_id=v.id;
    for i in 1..v.question_count loop insert into public.test_questions(test_version_id,number,dimension_code,prompt) values(v.id,i,dims[((i-1)%4)+1],prompts[((i-1)%8)+1]||case when i>8 then ' En situaciones nuevas.' else '' end); end loop;
  end loop;
  for v in select id,code,question_count from public.test_versions where code in ('PERSONAL_STRENGTHS_FREE','PERSONAL_STRENGTHS_PREMIUM') loop
    dims:=array['CREATIVITY','EMPATHY','DISCIPLINE','LEADERSHIP','RESILIENCE','COLLABORATION'];
    prompts:=array['Encuentro soluciones originales ante problemas nuevos.','Percibo con facilidad cómo se sienten otras personas.','Mantengo mis compromisos aunque pierda motivación.','Tomo iniciativa cuando un grupo necesita dirección.','Me recupero y aprendo después de una dificultad.','Contribuyo a que un equipo trabaje con confianza.'];
    delete from public.test_questions where test_version_id=v.id;
    for i in 1..v.question_count loop insert into public.test_questions(test_version_id,number,dimension_code,prompt) values(v.id,i,dims[((i-1)%6)+1],prompts[((i-1)%6)+1]||case when i>6 then ' Incluso bajo presión.' else '' end); end loop;
  end loop;
end $$;

create or replace function public.get_test_catalog()
returns table(type_code text,name text,description text,icon text,status text,free_code text,free_questions int,premium_code text,premium_questions int,price numeric,currency char)
language sql security definer set search_path=public as $$
 select t.code,t.name,t.description,t.icon,t.status,
 max(v.code) filter(where v.access_level='FREE'),max(v.question_count) filter(where v.access_level='FREE'),
 max(v.code) filter(where v.access_level='PREMIUM'),max(v.question_count) filter(where v.access_level='PREMIUM'),
 max(p.price) filter(where p.access_level='PREMIUM'),max(p.currency) filter(where p.access_level='PREMIUM')
 from test_types t join test_versions v on v.test_type_id=t.id and v.is_active
 left join test_products p on p.test_version_id=v.id and p.is_active
 where t.status in ('ACTIVE','COMING_SOON') group by t.id order by t.sort_order,t.name;
$$;
grant execute on function public.get_test_catalog() to anon,authenticated;

create or replace function public.create_pending_payment(p_user_id uuid,p_product_code text,p_payer_name text,p_reference text,p_receipt_url text)
returns uuid language plpgsql security definer set search_path=public as $$
declare p public.test_products%rowtype; pid uuid; begin
 select * into p from test_products where code=p_product_code and access_level='PREMIUM' and is_active limit 1;
 if p.id is null then raise exception 'Producto no disponible'; end if;
 insert into payments(user_id,product_id,transaction_reference,amount,currency,status,payer_name,payer_reference,receipt_url)
 values(p_user_id,p.id,'QR-'||gen_random_uuid(),p.price,p.currency,'PENDING',nullif(trim(p_payer_name),''),nullif(trim(p_reference),''),p_receipt_url) returning id into pid;
 return pid; end $$;
revoke all on function public.create_pending_payment(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.create_pending_payment(uuid,text,text,text,text) to service_role;

insert into storage.buckets(id,name,public) values('payment-receipts','payment-receipts',false) on conflict(id) do update set public=false;
