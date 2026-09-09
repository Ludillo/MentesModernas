import {writeFileSync} from 'node:fs'
import {CAREER_BANK,CAREER_CODE} from '../shared/career2026.ts'
const quote=s=>`'${s.replaceAll("'","''")}'`
const rows=[];let n=0
// Interleave dimensions within each block to avoid four near-identical questions together.
for(const block of [Object.keys(CAREER_BANK).slice(0,6),Object.keys(CAREER_BANK).slice(6)])for(let i=0;i<4;i++)for(const dim of block)rows.push(`(v,${++n},${quote(dim)},${quote(CAREER_BANK[dim][i])})`)
writeFileSync(new URL('../supabase/migrations/202609080001_vocational_ai_2026.sql',import.meta.url),`-- Additive seed. Re-running never overwrites an administrator's price or questions.
begin;
do $$ declare t uuid; v uuid; begin
insert into public.test_types(code,name,description,status,icon,sort_order)
values('VOCATIONAL_AI_2026','Test vocacional 2026 · Carreras ante la IA','Explora tus intereses, rutas profesionales y habilidades para trabajar con IA. Evidencia internacional 2025–2026.','ACTIVE','✦',0)
on conflict(code) do nothing;
select id into t from public.test_types where code='VOCATIONAL_AI_2026';
insert into public.test_versions(test_type_id,code,version,access_level,question_count,scoring_model,is_active,instructions)
values(t,'${CAREER_CODE}','2026.1','PREMIUM',48,'RIASEC_AI_2026',true,'Responde según tus intereses actuales y hábitos recientes. Las primeras 24 preguntas exploran actividades que te atraen; las siguientes 24, hábitos para aprender y trabajar con IA. No es una prueba de aptitud ni garantiza empleo.') on conflict(code) do nothing;
select id into v from public.test_versions where code='${CAREER_CODE}';
insert into public.test_products(code,test_type_id,test_version_id,name,access_level,price,currency,is_active)
values('${CAREER_CODE}',t,v,'Test vocacional 2026 · Carreras ante la IA','PREMIUM',45,'BOB',true) on conflict(code) do nothing;
insert into public.test_questions(test_version_id,number,dimension_code,prompt) values
${rows.join(',\n')}
on conflict(test_version_id,number) do nothing;
end $$;
commit;
`)
console.log(`Generated additive migration with ${n} unique questions.`)
