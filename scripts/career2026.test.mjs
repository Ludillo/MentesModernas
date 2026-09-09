import test from 'node:test'
import assert from 'node:assert/strict'
import {CAREER_BANK,buildCareerReport} from '../shared/career2026.ts'
const questions=Object.entries(CAREER_BANK).flatMap(([dimension_code,items])=>items.map((prompt,i)=>({id:`${dimension_code}-${i}`,dimension_code,prompt})))
const answers=value=>Object.fromEntries(questions.map(q=>[q.id,value]))
test('48 distinct prompts; balanced interests and habits',()=>{assert.equal(questions.length,48);assert.equal(new Set(questions.map(x=>x.prompt)).size,48);assert.equal(Object.keys(CAREER_BANK).length,12)})
test('zero and full responses preserve boundaries and label flat profiles',()=>{for(const n of [0,4]){const r=buildCareerReport(questions,answers(n));assert.ok(r.results.every(x=>x.percent===n*25));assert.ok(r.skills.every(x=>x.percent===n*25));assert.match(r.summary,/poco diferenciados/);assert.equal(r.pathways.length,6)}})
test('preparation does not silently change career affinity',()=>{const a=answers(0);for(const q of questions)if(['R','I'].includes(q.dimension_code))a[q.id]=4;const r=buildCareerReport(questions,a);const b={...a};for(const q of questions)if(q.dimension_code.length>1)b[q.id]=4;assert.deepEqual(buildCareerReport(questions,b).pathways,r.pathways);assert.ok(r.pathways.slice(0,2).every(x=>x.affinity===100))})
test('reject partial, forged, coercible and out of range answers',()=>{for(const invalid of [null,'4',true,NaN,5,-1,1.5]){const a=answers(2);a[questions[0].id]=invalid;assert.throws(()=>buildCareerReport(questions,a))}const a=answers(2);delete a[questions[0].id];a.forged=2;assert.throws(()=>buildCareerReport(questions,a));assert.throws(()=>buildCareerReport(questions.slice(1),answers(2)))})
test('reject changed dimension structure',()=>{assert.throws(()=>buildCareerReport(questions.map((q,i)=>i===0?{...q,dimension_code:'I'}:q),answers(2)))})
