-- MentesModernas - Schema inicial
-- Ejecutar mediante Supabase CLI migrations o pegar en SQL Editor.
create extension if not exists pgcrypto;

-- =========================
-- USERS / PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  age smallint check (age is null or age between 10 and 100),
  education_level text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name,avatar_url)
  values(new.id,new.email,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'avatar_url')
  on conflict(id) do update set
    email=excluded.email,
    full_name=coalesce(excluded.full_name,profiles.full_name),
    avatar_url=coalesce(excluded.avatar_url,profiles.avatar_url),
    updated_at=now();
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- SITE CONTENT / BRANDING
-- =========================
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.site_content(key,value) values
('home_hero', '{"title":"Conócete mejor. Decide con más claridad.","subtitle":"Tests modernos para descubrir intereses, fortalezas y formas de aprender.","cta":"Descubrir mis tests"}'),
('brand', '{"name":"MentesModernas","logo_url":"","whatsapp":"59170000000"}'),
('contact', '{"title":"¿Tienes una pregunta o necesitas orientación?","subtitle":"Escríbenos y te responderemos lo antes posible."}')
on conflict(key) do nothing;

-- =========================
-- TEST ENGINE
-- =========================
create table if not exists public.test_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','COMING_SOON','INACTIVE')),
  created_at timestamptz not null default now()
);

create table if not exists public.test_versions (
  id uuid primary key default gen_random_uuid(),
  test_type_id uuid not null references public.test_types(id),
  code text not null unique,
  version text not null,
  access_level text not null check(access_level in ('FREE','PREMIUM')),
  question_count integer not null,
  scoring_model text not null default 'RIASEC_SUM',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_version_id uuid not null references public.test_versions(id) on delete cascade,
  number integer not null,
  dimension_code varchar(10) not null,
  prompt text not null,
  is_active boolean not null default true,
  unique(test_version_id,number)
);

create table if not exists public.test_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  test_type_id uuid not null references public.test_types(id),
  test_version_id uuid not null references public.test_versions(id),
  name text not null,
  access_level text not null check(access_level in ('FREE','PREMIUM')),
  price numeric(12,2) not null default 0,
  currency char(3) not null default 'BOB',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================
-- COUPONS / PAYMENTS / ENTITLEMENTS
-- =========================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check(discount_type in ('PERCENTAGE','FIXED_AMOUNT','FREE')),
  discount_value numeric(12,2) not null default 0,
  product_id uuid references public.test_products(id),
  max_uses integer,
  uses_count integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  product_id uuid not null references public.test_products(id),
  coupon_id uuid references public.coupons(id),
  transaction_reference text not null unique,
  amount numeric(12,2) not null,
  currency char(3) not null default 'BOB',
  status text not null default 'PENDING' check(status in ('PENDING','PAID','FAILED','CANCELLED')),
  qr_payload text,
  callback_request jsonb,
  callback_response jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id),
  user_id uuid not null references public.profiles(id),
  payment_id uuid references public.payments(id),
  created_at timestamptz not null default now()
);

create table if not exists public.test_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  product_id uuid not null references public.test_products(id),
  payment_id uuid not null references public.payments(id),
  status text not null default 'AVAILABLE' check(status in ('AVAILABLE','CONSUMED','CANCELLED')),
  evaluation_id uuid,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

-- =========================
-- FINAL EVALUATIONS ONLY
-- =========================
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  test_type_id uuid not null references public.test_types(id),
  test_version_id uuid not null references public.test_versions(id),
  entitlement_id uuid references public.test_entitlements(id),
  answers jsonb not null,
  scores jsonb not null,
  result_json jsonb not null,
  completed_at timestamptz not null default now()
);

alter table public.test_entitlements
  drop constraint if exists fk_entitlement_evaluation;
alter table public.test_entitlements
  add constraint fk_entitlement_evaluation foreign key(evaluation_id) references public.evaluations(id);

create unique index if not exists ux_entitlement_consumed_eval
on public.test_entitlements(evaluation_id) where evaluation_id is not null;

-- =========================
-- CONTACT + ANALYTICS
-- =========================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  status text not null default 'NEW' check(status in ('NEW','READ','ANSWERED','ARCHIVED')),
  created_at timestamptz not null default now()
);

create table if not exists public.page_visits (
  id bigint generated always as identity primary key,
  visitor_id uuid,
  path text not null,
  referrer text,
  user_agent text,
  visited_at timestamptz not null default now()
);
create index if not exists ix_page_visits_visited_at on public.page_visits(visited_at);
create index if not exists ix_page_visits_path on public.page_visits(path);

-- =========================
-- ADMINISTRATION
-- Passwords are HASHED, never reversibly encrypted.
-- =========================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  role text not null default 'ADMIN' check(role in ('ADMIN','SUPERADMIN')),
  is_active boolean not null default true,
  failed_attempts integer not null default 0,
  last_login_at timestamptz,
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- citext may not yet be available

create table if not exists public.admin_login_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ix_admin_tokens_admin_expiry on public.admin_login_tokens(admin_id,expires_at);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.admin_users(id),
  action text not null,
  entity text,
  entity_id text,
  payload jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create or replace function public.admin_verify_password(p_email text,p_password text)
returns table(id uuid,email text,display_name text,role text)
language sql security definer set search_path=public as $$
  select a.id,a.email,a.display_name,a.role
  from public.admin_users a
  where lower(a.email)=lower(p_email)
    and a.is_active=true
    and a.password_hash=crypt(p_password,a.password_hash)
  limit 1;
$$;

create or replace function public.admin_change_password(p_admin_id uuid,p_current text,p_new text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if length(p_new)<12 then raise exception 'La nueva contraseña debe tener al menos 12 caracteres'; end if;
  if not exists(select 1 from public.admin_users where id=p_admin_id and is_active and password_hash=crypt(p_current,password_hash)) then
    return false;
  end if;
  update public.admin_users set password_hash=crypt(p_new,gen_salt('bf',12)),password_changed_at=now(),updated_at=now() where id=p_admin_id;
  return true;
end $$;

-- =========================
-- PUBLIC FUNCTION TO GET QUESTIONS
-- Premium questions require auth + available entitlement.
-- =========================
create or replace function public.get_active_test_questions(p_test_code text)
returns table(id uuid,test_version_id uuid,number integer,dimension_code varchar,prompt text,is_active boolean)
language plpgsql security definer set search_path=public as $$
declare
  v_version public.test_versions%rowtype;
begin
  select v.* into v_version
  from public.test_versions v
  where v.code=p_test_code and v.is_active=true
  limit 1;

  if v_version.id is null then raise exception 'Test no encontrado'; end if;

  if v_version.access_level='PREMIUM' then
    if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
    if not exists(
      select 1
      from public.test_entitlements e
      join public.test_products p on p.id=e.product_id
      where e.user_id=auth.uid()
        and e.status='AVAILABLE'
        and p.test_version_id=v_version.id
    ) then
      raise exception 'No existe un test Premium disponible';
    end if;
  end if;

  return query
  select q.id,q.test_version_id,q.number,q.dimension_code,q.prompt,q.is_active
  from public.test_questions q
  where q.test_version_id=v_version.id and q.is_active=true
  order by q.number;
end $$;

grant execute on function public.get_active_test_questions(text) to anon,authenticated;

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.test_types enable row level security;
alter table public.test_versions enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_products enable row level security;
alter table public.coupons enable row level security;
alter table public.payments enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.test_entitlements enable row level security;
alter table public.evaluations enable row level security;
alter table public.contact_messages enable row level security;
alter table public.page_visits enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_login_tokens enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "public site content" on public.site_content;
create policy "public site content" on public.site_content for select using(is_active=true);

drop policy if exists "public test types" on public.test_types;
create policy "public test types" on public.test_types for select using(status in ('ACTIVE','COMING_SOON'));

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles for select to authenticated using(auth.uid()=id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);

drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for select to authenticated using(auth.uid()=user_id);

drop policy if exists "own entitlements" on public.test_entitlements;
create policy "own entitlements" on public.test_entitlements for select to authenticated using(auth.uid()=user_id);

drop policy if exists "own evaluations" on public.evaluations;
create policy "own evaluations" on public.evaluations for select to authenticated using(auth.uid()=user_id);

-- tables not exposed directly to anon/authenticated use no insert/update policies.
-- Service-role Edge Functions perform protected writes.

-- =========================
-- SEED TEST CATALOG
-- =========================

insert into public.test_types(id,code,name,description,status) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VOCATIONAL','Orientación Vocacional','Explora intereses ocupacionales mediante seis áreas RIASEC.','ACTIVE'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','LEARNING_STYLE','Estilo de Aprendizaje','Descubre preferencias para aprender y estudiar.','COMING_SOON'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','PERSONAL_STRENGTHS','Fortalezas Personales','Explora recursos y fortalezas percibidas.','COMING_SOON')
on conflict(code) do update set name=excluded.name,description=excluded.description,status=excluded.status;

insert into public.test_versions(id,test_type_id,code,version,access_level,question_count,scoring_model,is_active) values
('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VOCATIONAL_FREE','1.0','FREE',35,'RIASEC_SUM',true),
('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VOCATIONAL_PREMIUM','1.0','PREMIUM',72,'RIASEC_SUM',true)
on conflict(code) do update set question_count=excluded.question_count,is_active=excluded.is_active;

insert into public.test_products(id,code,test_type_id,test_version_id,name,access_level,price,currency,is_active) values
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','VOCATIONAL_FREE','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Orientación Vocacional Gratis','FREE',0,'BOB',true),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','VOCATIONAL_PREMIUM','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','Perfil Vocacional Premium','PREMIUM',50,'BOB',true)
on conflict(code) do update set price=excluded.price,is_active=excluded.is_active;

delete from public.test_questions where test_version_id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');

insert into public.test_questions(test_version_id,number,dimension_code,prompt,is_active) values
('11111111-1111-4111-8111-111111111111', 1, 'R', 'Disfruto armar, reparar o instalar objetos, equipos o dispositivos.', true),
('11111111-1111-4111-8111-111111111111', 2, 'I', 'Me interesa investigar por qué ocurren los fenómenos y comprobar explicaciones.', true),
('11111111-1111-4111-8111-111111111111', 3, 'A', 'Me gusta crear dibujos, diseños, historias, música o contenido original.', true),
('11111111-1111-4111-8111-111111111111', 4, 'S', 'Siento satisfacción al orientar, enseñar o acompañar a otras personas.', true),
('11111111-1111-4111-8111-111111111111', 5, 'E', 'Me entusiasma liderar grupos y movilizarlos hacia una meta.', true),
('11111111-1111-4111-8111-111111111111', 6, 'C', 'Prefiero trabajar con procedimientos claros, registros y datos ordenados.', true),
('11111111-1111-4111-8111-111111111111', 7, 'R', 'Me gustaría trabajar con herramientas, maquinaria o tecnología aplicada.', true),
('11111111-1111-4111-8111-111111111111', 8, 'I', 'Me interesa leer sobre ciencia, salud, tecnología o investigación.', true),
('11111111-1111-4111-8111-111111111111', 9, 'A', 'Valoro la originalidad más que seguir una única forma de hacer las cosas.', true),
('11111111-1111-4111-8111-111111111111', 10, 'S', 'Me gustaría contribuir directamente al bienestar de personas o comunidades.', true),
('11111111-1111-4111-8111-111111111111', 11, 'E', 'Me motiva iniciar proyectos y asumir responsabilidad por sus resultados.', true),
('11111111-1111-4111-8111-111111111111', 12, 'C', 'Me resulta natural planificar tareas, tiempos y recursos.', true),
('11111111-1111-4111-8111-111111111111', 13, 'R', 'Me interesan actividades al aire libre, de campo, construcción o producción.', true),
('11111111-1111-4111-8111-111111111111', 14, 'I', 'Me entusiasma experimentar, comparar resultados y sacar conclusiones.', true),
('11111111-1111-4111-8111-111111111111', 15, 'A', 'Me gusta comunicar emociones o ideas mediante recursos visuales o escénicos.', true),
('11111111-1111-4111-8111-111111111111', 16, 'S', 'Las personas suelen buscarme para pedir consejo o ayuda.', true),
('11111111-1111-4111-8111-111111111111', 17, 'E', 'Me atraen los negocios, las ventas, la gestión y la competencia.', true),
('11111111-1111-4111-8111-111111111111', 18, 'C', 'Me gusta que la información esté completa, correcta y verificable.', true),
('11111111-1111-4111-8111-111111111111', 19, 'R', 'Me atraen la electrónica, mecánica, ingeniería, logística o procesos productivos.', true),
('11111111-1111-4111-8111-111111111111', 20, 'I', 'Podría dedicar bastante tiempo a estudiar un tema que me genera curiosidad.', true),
('11111111-1111-4111-8111-111111111111', 21, 'A', 'Disfruto escribir, diseñar, interpretar o producir materiales creativos.', true),
('11111111-1111-4111-8111-111111111111', 22, 'S', 'Me importa que mi trabajo tenga un impacto humano positivo.', true),
('11111111-1111-4111-8111-111111111111', 23, 'E', 'Me siento cómodo hablando ante un grupo y defendiendo una idea.', true),
('11111111-1111-4111-8111-111111111111', 24, 'C', 'Me agrada trabajar con bases de datos, presupuestos o inventarios.', true),
('11111111-1111-4111-8111-111111111111', 25, 'R', 'Me gusta ver el resultado tangible de mi trabajo al final del día.', true),
('11111111-1111-4111-8111-111111111111', 26, 'I', 'Me atraen los laboratorios, el diagnóstico, la programación o la investigación.', true),
('11111111-1111-4111-8111-111111111111', 27, 'A', 'Me gusta transformar ideas abstractas en una propuesta atractiva.', true),
('11111111-1111-4111-8111-111111111111', 28, 'S', 'Me gustaría mediar, facilitar acuerdos o ayudar a resolver conflictos.', true),
('11111111-1111-4111-8111-111111111111', 29, 'E', 'Me entusiasma detectar oportunidades y convertirlas en acciones.', true),
('11111111-1111-4111-8111-111111111111', 30, 'C', 'Disfruto revisar que un proceso se cumpla correctamente.', true),
('11111111-1111-4111-8111-111111111111', 31, 'R', 'Me interesa comprender cómo funcionan los aparatos y sistemas físicos.', true),
('11111111-1111-4111-8111-111111111111', 32, 'I', 'Disfruto identificar causas, relaciones y posibles soluciones.', true),
('11111111-1111-4111-8111-111111111111', 33, 'A', 'Me siento cómodo improvisando y explorando posibilidades distintas.', true),
('11111111-1111-4111-8111-111111111111', 34, 'S', 'Disfruto trabajar en equipo y apoyar el desarrollo de otras personas.', true),
('11111111-1111-4111-8111-111111111111', 35, 'E', 'Disfruto asumir retos y tomar la iniciativa.', true);

insert into public.test_questions(test_version_id,number,dimension_code,prompt,is_active) values
('22222222-2222-4222-8222-222222222222', 1, 'R', 'Disfruto armar, reparar o instalar objetos, equipos o dispositivos.', true),
('22222222-2222-4222-8222-222222222222', 2, 'R', 'Me atraen las actividades prácticas en las que se obtiene un resultado visible.', true),
('22222222-2222-4222-8222-222222222222', 3, 'R', 'Me gustaría trabajar con herramientas, maquinaria o tecnología aplicada.', true),
('22222222-2222-4222-8222-222222222222', 4, 'R', 'Aprendo mejor cuando puedo practicar y manipular materiales o equipos.', true),
('22222222-2222-4222-8222-222222222222', 5, 'R', 'Me interesan actividades al aire libre, de campo, construcción o producción.', true),
('22222222-2222-4222-8222-222222222222', 6, 'R', 'Prefiero solucionar un problema concreto antes que discutirlo demasiado.', true),
('22222222-2222-4222-8222-222222222222', 7, 'R', 'Me atraen la electrónica, mecánica, ingeniería, logística o procesos productivos.', true),
('22222222-2222-4222-8222-222222222222', 8, 'R', 'Me gustaría diseñar o mejorar soluciones físicas y técnicas.', true),
('22222222-2222-4222-8222-222222222222', 9, 'R', 'Me gusta ver el resultado tangible de mi trabajo al final del día.', true),
('22222222-2222-4222-8222-222222222222', 10, 'R', 'Tengo facilidad para tareas que requieren precisión manual o espacial.', true),
('22222222-2222-4222-8222-222222222222', 11, 'R', 'Me interesa comprender cómo funcionan los aparatos y sistemas físicos.', true),
('22222222-2222-4222-8222-222222222222', 12, 'R', 'Me sentiría cómodo trabajando en un taller, planta, obra o entorno técnico.', true),
('22222222-2222-4222-8222-222222222222', 13, 'I', 'Me interesa investigar por qué ocurren los fenómenos y comprobar explicaciones.', true),
('22222222-2222-4222-8222-222222222222', 14, 'I', 'Disfruto resolver problemas complejos mediante análisis y razonamiento.', true),
('22222222-2222-4222-8222-222222222222', 15, 'I', 'Me interesa leer sobre ciencia, salud, tecnología o investigación.', true),
('22222222-2222-4222-8222-222222222222', 16, 'I', 'Me gusta formular preguntas y buscar evidencia antes de decidir.', true),
('22222222-2222-4222-8222-222222222222', 17, 'I', 'Me entusiasma experimentar, comparar resultados y sacar conclusiones.', true),
('22222222-2222-4222-8222-222222222222', 18, 'I', 'Me interesa comprender datos, patrones y relaciones entre variables.', true),
('22222222-2222-4222-8222-222222222222', 19, 'I', 'Podría dedicar bastante tiempo a estudiar un tema que me genera curiosidad.', true),
('22222222-2222-4222-8222-222222222222', 20, 'I', 'Prefiero decisiones basadas en evidencia, medición y análisis.', true),
('22222222-2222-4222-8222-222222222222', 21, 'I', 'Me atraen los laboratorios, el diagnóstico, la programación o la investigación.', true),
('22222222-2222-4222-8222-222222222222', 22, 'I', 'Me gusta aprender teorías y utilizarlas para explicar problemas reales.', true),
('22222222-2222-4222-8222-222222222222', 23, 'I', 'Disfruto identificar causas, relaciones y posibles soluciones.', true),
('22222222-2222-4222-8222-222222222222', 24, 'I', 'Me interesa descubrir información nueva o desarrollar conocimiento.', true),
('22222222-2222-4222-8222-222222222222', 25, 'A', 'Me gusta crear dibujos, diseños, historias, música o contenido original.', true),
('22222222-2222-4222-8222-222222222222', 26, 'A', 'Busco formas diferentes y creativas de expresar una idea.', true),
('22222222-2222-4222-8222-222222222222', 27, 'A', 'Valoro la originalidad más que seguir una única forma de hacer las cosas.', true),
('22222222-2222-4222-8222-222222222222', 28, 'A', 'Me atraen profesiones donde la estética y la imaginación son importantes.', true),
('22222222-2222-4222-8222-222222222222', 29, 'A', 'Me gusta comunicar emociones o ideas mediante recursos visuales o escénicos.', true),
('22222222-2222-4222-8222-222222222222', 30, 'A', 'Me gusta trabajar con libertad para proponer conceptos nuevos.', true),
('22222222-2222-4222-8222-222222222222', 31, 'A', 'Disfruto escribir, diseñar, interpretar o producir materiales creativos.', true),
('22222222-2222-4222-8222-222222222222', 32, 'A', 'Me motiva explorar tendencias culturales, visuales o comunicacionales.', true),
('22222222-2222-4222-8222-222222222222', 33, 'A', 'Me gusta transformar ideas abstractas en una propuesta atractiva.', true),
('22222222-2222-4222-8222-222222222222', 34, 'A', 'Me gustaría que mi carrera permita innovar y desarrollar un estilo propio.', true),
('22222222-2222-4222-8222-222222222222', 35, 'A', 'Me siento cómodo improvisando y explorando posibilidades distintas.', true),
('22222222-2222-4222-8222-222222222222', 36, 'A', 'Me atrae crear experiencias que generen emoción o impacto.', true),
('22222222-2222-4222-8222-222222222222', 37, 'S', 'Siento satisfacción al orientar, enseñar o acompañar a otras personas.', true),
('22222222-2222-4222-8222-222222222222', 38, 'S', 'Escucho con paciencia y procuro comprender las necesidades de otros.', true),
('22222222-2222-4222-8222-222222222222', 39, 'S', 'Me gustaría contribuir directamente al bienestar de personas o comunidades.', true),
('22222222-2222-4222-8222-222222222222', 40, 'S', 'Me sentiría cómodo trabajando en educación, salud o apoyo social.', true),
('22222222-2222-4222-8222-222222222222', 41, 'S', 'Las personas suelen buscarme para pedir consejo o ayuda.', true),
('22222222-2222-4222-8222-222222222222', 42, 'S', 'Tengo facilidad para explicar algo de manera comprensible.', true),
('22222222-2222-4222-8222-222222222222', 43, 'S', 'Me importa que mi trabajo tenga un impacto humano positivo.', true),
('22222222-2222-4222-8222-222222222222', 44, 'S', 'Tengo disposición para colaborar y trabajar de forma cercana con personas.', true),
('22222222-2222-4222-8222-222222222222', 45, 'S', 'Me gustaría mediar, facilitar acuerdos o ayudar a resolver conflictos.', true),
('22222222-2222-4222-8222-222222222222', 46, 'S', 'Me siento motivado cuando puedo enseñar, cuidar, orientar o servir.', true),
('22222222-2222-4222-8222-222222222222', 47, 'S', 'Disfruto trabajar en equipo y apoyar el desarrollo de otras personas.', true),
('22222222-2222-4222-8222-222222222222', 48, 'S', 'Me interesa comprender cómo piensan, sienten y aprenden las personas.', true),
('22222222-2222-4222-8222-222222222222', 49, 'E', 'Me entusiasma liderar grupos y movilizarlos hacia una meta.', true),
('22222222-2222-4222-8222-222222222222', 50, 'E', 'Me interesa negociar, persuadir o presentar propuestas.', true),
('22222222-2222-4222-8222-222222222222', 51, 'E', 'Me motiva iniciar proyectos y asumir responsabilidad por sus resultados.', true),
('22222222-2222-4222-8222-222222222222', 52, 'E', 'Me gusta tomar decisiones y coordinar el trabajo de otras personas.', true),
('22222222-2222-4222-8222-222222222222', 53, 'E', 'Me atraen los negocios, las ventas, la gestión y la competencia.', true),
('22222222-2222-4222-8222-222222222222', 54, 'E', 'Me veo creando una empresa, iniciativa o proyecto propio.', true),
('22222222-2222-4222-8222-222222222222', 55, 'E', 'Me siento cómodo hablando ante un grupo y defendiendo una idea.', true),
('22222222-2222-4222-8222-222222222222', 56, 'E', 'Me interesa alcanzar objetivos ambiciosos y medir resultados.', true),
('22222222-2222-4222-8222-222222222222', 57, 'E', 'Me entusiasma detectar oportunidades y convertirlas en acciones.', true),
('22222222-2222-4222-8222-222222222222', 58, 'E', 'Me atraen cargos con autonomía, influencia y responsabilidad.', true),
('22222222-2222-4222-8222-222222222222', 59, 'E', 'Disfruto asumir retos y tomar la iniciativa.', true),
('22222222-2222-4222-8222-222222222222', 60, 'E', 'Me gustaría gestionar recursos, personas o proyectos.', true),
('22222222-2222-4222-8222-222222222222', 61, 'C', 'Prefiero trabajar con procedimientos claros, registros y datos ordenados.', true),
('22222222-2222-4222-8222-222222222222', 62, 'C', 'Soy cuidadoso al revisar números, documentos o detalles.', true),
('22222222-2222-4222-8222-222222222222', 63, 'C', 'Me resulta natural planificar tareas, tiempos y recursos.', true),
('22222222-2222-4222-8222-222222222222', 64, 'C', 'Disfruto clasificar información y mantener sistemas organizados.', true),
('22222222-2222-4222-8222-222222222222', 65, 'C', 'Me siento cómodo trabajando con normas, calendarios y controles.', true),
('22222222-2222-4222-8222-222222222222', 66, 'C', 'Me gusta que la información esté completa, correcta y verificable.', true),
('22222222-2222-4222-8222-222222222222', 67, 'C', 'Me interesan la administración, contabilidad, archivo o control de operaciones.', true),
('22222222-2222-4222-8222-222222222222', 68, 'C', 'Puedo mantener la concentración en tareas detalladas y repetitivas.', true),
('22222222-2222-4222-8222-222222222222', 69, 'C', 'Me agrada trabajar con bases de datos, presupuestos o inventarios.', true),
('22222222-2222-4222-8222-222222222222', 70, 'C', 'Valoro la estabilidad, el orden y la claridad en las responsabilidades.', true),
('22222222-2222-4222-8222-222222222222', 71, 'C', 'Disfruto revisar que un proceso se cumpla correctamente.', true),
('22222222-2222-4222-8222-222222222222', 72, 'C', 'Me resulta fácil seguir instrucciones y mantener la información actualizada.', true);

-- Example coupon for testing
insert into public.coupons(code,discount_type,discount_value,product_id,max_uses,valid_until,is_active)
values('LANZAMIENTO100','FREE',100,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',100,now()+interval '90 days',true)
on conflict(code) do nothing;

-- IMPORTANT:
-- Create your first administrator manually with scripts/create_admin.sql.


-- =========================
-- PROTECTED BUSINESS FUNCTIONS (Edge Functions / service_role only)
-- =========================
create or replace function public.create_demo_entitlement(
  p_user_id uuid,
  p_product_code text,
  p_coupon_code text default null
)
returns table(entitlement_id uuid,payment_id uuid,amount numeric)
language plpgsql security definer set search_path=public as $$
declare
  v_product public.test_products%rowtype;
  v_coupon public.coupons%rowtype;
  v_amount numeric(12,2);
  v_payment uuid;
  v_entitlement uuid;
  v_existing uuid;
begin
  select e.id into v_existing
  from public.test_entitlements e
  join public.test_products p on p.id=e.product_id
  where e.user_id=p_user_id and e.status='AVAILABLE' and p.code=p_product_code
  order by e.created_at desc limit 1;

  if v_existing is not null then
    return query
    select v_existing,pay.id,pay.amount
    from public.test_entitlements en
    join public.payments pay on pay.id=en.payment_id
    where en.id=v_existing;
    return;
  end if;

  select * into v_product
  from public.test_products
  where code=p_product_code and is_active=true and access_level='PREMIUM'
  limit 1;
  if v_product.id is null then raise exception 'Producto no disponible'; end if;

  v_amount := v_product.price;

  if nullif(trim(p_coupon_code),'') is not null then
    select * into v_coupon
    from public.coupons
    where upper(code)=upper(trim(p_coupon_code))
      and is_active=true
      and valid_from<=now()
      and (valid_until is null or valid_until>=now())
      and (product_id is null or product_id=v_product.id)
      and (max_uses is null or uses_count<max_uses)
    for update;

    if v_coupon.id is null then raise exception 'Cupón inválido o vencido'; end if;

    if v_coupon.discount_type='FREE' then
      v_amount:=0;
    elsif v_coupon.discount_type='PERCENTAGE' then
      v_amount:=greatest(0,round(v_amount*(1-(v_coupon.discount_value/100.0)),2));
    elsif v_coupon.discount_type='FIXED_AMOUNT' then
      v_amount:=greatest(0,v_amount-v_coupon.discount_value);
    end if;
  end if;

  insert into public.payments(user_id,product_id,coupon_id,transaction_reference,amount,currency,status,paid_at)
  values(p_user_id,v_product.id,v_coupon.id,'DEMO-'||gen_random_uuid()::text,v_amount,v_product.currency,'PAID',now())
  returning id into v_payment;

  if v_coupon.id is not null then
    update public.coupons set uses_count=uses_count+1 where id=v_coupon.id;
    insert into public.coupon_redemptions(coupon_id,user_id,payment_id) values(v_coupon.id,p_user_id,v_payment);
  end if;

  insert into public.test_entitlements(user_id,product_id,payment_id,status)
  values(p_user_id,v_product.id,v_payment,'AVAILABLE')
  returning id into v_entitlement;

  return query select v_entitlement,v_payment,v_amount;
end $$;

create or replace function public.finalize_premium_evaluation(
  p_user_id uuid,
  p_test_code text,
  p_answers jsonb,
  p_scores jsonb,
  p_result jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_version public.test_versions%rowtype;
  v_type_id uuid;
  v_entitlement public.test_entitlements%rowtype;
  v_eval uuid;
begin
  select v.* into v_version
  from public.test_versions v where v.code=p_test_code and v.access_level='PREMIUM' and v.is_active=true limit 1;
  if v_version.id is null then raise exception 'Test Premium no disponible'; end if;
  v_type_id:=v_version.test_type_id;

  select e.* into v_entitlement
  from public.test_entitlements e
  join public.test_products p on p.id=e.product_id
  where e.user_id=p_user_id and e.status='AVAILABLE' and p.test_version_id=v_version.id
  order by e.created_at asc
  limit 1
  for update of e;

  if v_entitlement.id is null then raise exception 'No existe un test pagado disponible'; end if;

  insert into public.evaluations(user_id,test_type_id,test_version_id,entitlement_id,answers,scores,result_json)
  values(p_user_id,v_type_id,v_version.id,v_entitlement.id,p_answers,p_scores,p_result)
  returning id into v_eval;

  update public.test_entitlements
  set status='CONSUMED',evaluation_id=v_eval,consumed_at=now()
  where id=v_entitlement.id;

  return v_eval;
end $$;

revoke all on function public.create_demo_entitlement(uuid,text,text) from public,anon,authenticated;
revoke all on function public.finalize_premium_evaluation(uuid,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.admin_verify_password(text,text) from public,anon,authenticated;
revoke all on function public.admin_change_password(uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_demo_entitlement(uuid,text,text) to service_role;
grant execute on function public.finalize_premium_evaluation(uuid,text,jsonb,jsonb,jsonb) to service_role;
grant execute on function public.admin_verify_password(text,text) to service_role;
grant execute on function public.admin_change_password(uuid,text,text) to service_role;

-- Public branding bucket. Uploads are performed by the admin Edge Function with service_role.
insert into storage.buckets(id,name,public)
values('branding','branding',true)
on conflict(id) do update set public=true;


create or replace function public.admin_change_email(p_admin_id uuid,p_password text,p_new_email text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if position('@' in p_new_email)=0 then raise exception 'Correo inválido'; end if;
  if not exists(select 1 from public.admin_users where id=p_admin_id and is_active and password_hash=crypt(p_password,password_hash)) then
    return false;
  end if;
  update public.admin_users set email=lower(trim(p_new_email)),updated_at=now() where id=p_admin_id;
  return true;
end $$;
revoke all on function public.admin_change_email(uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_change_email(uuid,text,text) to service_role;
