-- Restaurar el precio normal después de la prueba real de integración QR.
update public.test_products
set price = 50
where code = 'VOCATIONAL_PREMIUM';
