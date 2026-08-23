create table if not exists public.test_completion_events (
  id bigint generated always as identity primary key,
  test_code text not null,
  visitor_id uuid not null,
  completed_at timestamptz not null default now(),
  unique(test_code,visitor_id)
);

create table if not exists public.test_feedback (
  id bigint generated always as identity primary key,
  test_code text not null,
  visitor_id uuid not null,
  helpful boolean not null,
  clarity smallint not null check(clarity between 1 and 5),
  evaluation_id uuid references public.evaluations(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(test_code,visitor_id)
);

alter table public.test_completion_events enable row level security;
alter table public.test_feedback enable row level security;

create or replace function public.record_test_completion(p_test_code text,p_visitor_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from test_versions where code=p_test_code and is_active) then raise exception 'Test no válido'; end if;
  insert into test_completion_events(test_code,visitor_id) values(p_test_code,p_visitor_id) on conflict(test_code,visitor_id) do nothing;
end $$;

create or replace function public.submit_test_feedback(p_test_code text,p_visitor_id uuid,p_helpful boolean,p_clarity integer,p_evaluation_id uuid default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_clarity not between 1 and 5 then raise exception 'Valoración no válida'; end if;
  if not exists(select 1 from test_versions where code=p_test_code and is_active) then raise exception 'Test no válido'; end if;
  insert into test_feedback(test_code,visitor_id,helpful,clarity,evaluation_id)
  values(p_test_code,p_visitor_id,p_helpful,p_clarity,p_evaluation_id)
  on conflict(test_code,visitor_id) do update set helpful=excluded.helpful,clarity=excluded.clarity,evaluation_id=coalesce(excluded.evaluation_id,test_feedback.evaluation_id),created_at=now();
end $$;

create or replace function public.get_public_test_stats()
returns table(completed_tests bigint,survey_responses bigint,helpful_percentage numeric,average_clarity numeric)
language sql stable security definer set search_path=public as $$
  select
    (select count(*) from test_completion_events),
    count(*)::bigint,
    coalesce(round(100.0*count(*) filter(where helpful)/nullif(count(*),0),0),0),
    coalesce(round(avg(clarity),1),0)
  from test_feedback;
$$;

grant execute on function public.record_test_completion(text,uuid) to anon,authenticated;
grant execute on function public.submit_test_feedback(text,uuid,boolean,integer,uuid) to anon,authenticated;
grant execute on function public.get_public_test_stats() to anon,authenticated;
