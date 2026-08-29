-- Restaurar los precios comerciales acordados después de las pruebas de integración.
update public.test_products
set price = case
  when code in ('VOCATIONAL_PREMIUM','LEARNING_STYLE_PREMIUM','PERSONAL_STRENGTHS_PREMIUM') then 50
  when code in ('AUTISM_TRAITS_PREMIUM','ADHD_TRAITS_PREMIUM') then 45
  else price
end,
currency = 'BOB'
where code in (
  'VOCATIONAL_PREMIUM',
  'LEARNING_STYLE_PREMIUM',
  'PERSONAL_STRENGTHS_PREMIUM',
  'AUTISM_TRAITS_PREMIUM',
  'ADHD_TRAITS_PREMIUM'
);
