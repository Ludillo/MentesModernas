drop policy if exists "public active test versions" on public.test_versions;
create policy "public active test versions"
on public.test_versions
for select
using (is_active = true);
