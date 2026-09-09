-- Precio temporal solicitado para una prueba real de integración QR.
update public.test_products
set price = 10
where code = 'VOCATIONAL_PREMIUM';
