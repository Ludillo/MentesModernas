-- Administradores con identidad Google y precios QR de prueba.
alter table public.admin_users alter column password_hash drop not null;
alter table public.admin_users add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.admin_users add column if not exists auth_provider text default 'google';
create unique index if not exists ux_admin_users_auth_user on public.admin_users(auth_user_id) where auth_user_id is not null;
create unique index if not exists ux_admin_users_email_lower on public.admin_users(lower(email));

update public.admin_users
set role='SUPERADMIN',is_active=true,auth_provider='google',updated_at=now()
where lower(email)='ludwingcocajimenez@gmail.com';

update public.test_products set price=50,currency='BOB'
where code in ('VOCATIONAL_PREMIUM','LEARNING_STYLE_PREMIUM','PERSONAL_STRENGTHS_PREMIUM')
  and access_level='PREMIUM';
