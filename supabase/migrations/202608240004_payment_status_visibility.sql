drop policy if exists "public active test products" on public.test_products;
create policy "public active test products"
on public.test_products
for select
using (is_active = true);
