insert into public.site_content (key, value, is_active)
values (
  'social_links',
  '{"whatsapp":{"enabled":false,"number":"","message":"Hola MentesModernas, quisiera recibir más información."},"facebook":{"enabled":false,"url":""},"instagram":{"enabled":false,"url":""},"tiktok":{"enabled":false,"url":""},"youtube":{"enabled":false,"url":""},"linkedin":{"enabled":false,"url":""}}'::jsonb,
  true
)
on conflict (key) do nothing;
