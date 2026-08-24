drop policy if exists "delete own evaluations" on public.evaluations;
create policy "delete own evaluations"
on public.evaluations
for delete
to authenticated
using (auth.uid() = user_id);

alter table public.test_entitlements
  drop constraint if exists fk_entitlement_evaluation;

alter table public.test_entitlements
  add constraint fk_entitlement_evaluation
  foreign key (evaluation_id)
  references public.evaluations(id)
  on delete set null;
