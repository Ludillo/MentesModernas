insert into public.admin_users(email,password_hash,display_name,role,is_active,auth_provider)
values('ludwingcocajimenez@gmail.com',null,'Ludwing Coca Jiménez','SUPERADMIN',true,'google')
on conflict(email) do update set
 display_name=excluded.display_name,
 role='SUPERADMIN',
 is_active=true,
 auth_provider='google',
 updated_at=now();
