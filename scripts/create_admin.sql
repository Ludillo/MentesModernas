-- Run this ONCE in Supabase SQL Editor and immediately replace the values.
-- Password is stored as a one-way bcrypt hash via pgcrypto.
-- DO NOT commit your real password into source control.

insert into public.admin_users(email,password_hash,display_name,role)
values(
  'admin@your-domain.com',
  crypt('CHANGE_THIS_PASSWORD_NOW_2026!', gen_salt('bf',12)),
  'Administrador MentesModernas',
  'SUPERADMIN'
);
