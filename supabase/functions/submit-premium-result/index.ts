import { corsHeaders, json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'

const AREA_META: Record<string,{name:string,description:string,careers:string[]}> = {
  R:{name:'Realista / Técnica',description:'Interés por construir, implementar, operar tecnología y resolver problemas concretos.',careers:['Ingenierías','Arquitectura','Mecánica','Electrónica','Logística','Agronomía']},
  I:{name:'Investigativa / Científica',description:'Interés por analizar, investigar, diagnosticar y comprender fenómenos mediante evidencia.',careers:['Medicina','Bioquímica','Ciencia de datos','Informática','Economía','Investigación']},
  A:{name:'Artística / Creativa',description:'Interés por crear, comunicar, innovar y expresar ideas con libertad y sensibilidad estética.',careers:['Diseño','Comunicación','Publicidad','Audiovisual','UX/UI','Arquitectura creativa']},
  S:{name:'Social / Servicio',description:'Interés por enseñar, cuidar, orientar, escuchar y contribuir al desarrollo de otras personas.',careers:['Psicología','Educación','Enfermería','Trabajo social','Fonoaudiología','Recursos humanos']},
  E:{name:'Emprendedora / Liderazgo',description:'Interés por liderar, negociar, emprender, influir y alcanzar metas con otras personas.',careers:['Administración','Marketing','Derecho','Ventas','Finanzas','Emprendimiento']},
  C:{name:'Convencional / Organización',description:'Interés por organizar información, controlar procesos, trabajar con datos y mantener precisión.',careers:['Contabilidad','Auditoría','Banca','Administración','Seguros','Control de procesos']}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)

  try{
    const {user,db}=await requireUser(req)
    const b=await req.json()
    const testCode=String(b.testCode??'')
    const answers=b.answers??{}

    if(testCode!=='VOCATIONAL_PREMIUM') return json(req,{error:'Test inválido.'},400)

    const {data:version,error:ve}=await db.from('test_versions')
      .select('id,test_type_id,question_count')
      .eq('code',testCode).eq('access_level','PREMIUM').eq('is_active',true).single()
    if(ve||!version)throw ve??new Error('Versión no disponible')

    const {data:questions,error:qe}=await db.from('test_questions')
      .select('id,dimension_code')
      .eq('test_version_id',version.id).eq('is_active',true).order('number')
    if(qe)throw qe
    if((questions??[]).length!==version.question_count)throw new Error('Configuración de preguntas inconsistente')

    const validIds=new Set((questions??[]).map((q:any)=>q.id))
    if(Object.keys(answers).length!==version.question_count) return json(req,{error:'La evaluación está incompleta.'},400)

    const totals:Record<string,number>={R:0,I:0,A:0,S:0,E:0,C:0}
    const counts:Record<string,number>={R:0,I:0,A:0,S:0,E:0,C:0}
    for(const q of questions??[]){
      if(!validIds.has(q.id))throw new Error('Pregunta inválida')
      const value=Number(answers[q.id])
      if(!Number.isInteger(value)||value<0||value>4)return json(req,{error:'Existe una respuesta inválida.'},400)
      counts[q.dimension_code]=(counts[q.dimension_code]||0)+1
      totals[q.dimension_code]=(totals[q.dimension_code]||0)+value
    }

    const results=Object.keys(totals).map(code=>{
      const maxScore=counts[code]*4
      return {
        code,
        name:AREA_META[code].name,
        score:totals[code],
        maxScore,
        percent:maxScore?Math.round(totals[code]/maxScore*100):0,
        description:AREA_META[code].description,
        careers:AREA_META[code].careers
      }
    }).sort((a,b)=>b.percent-a.percent)

    const scores=Object.fromEntries(results.map(x=>[x.code,{score:x.score,percent:x.percent}]))
    const top=results[0],second=results[1]
    const unique=(arr:string[])=>arr.filter((v,i,a)=>a.indexOf(v)===i)
    const high=unique([...(top?.careers??[]),...(second?.careers??[])]).slice(0,10)
    const medium=unique(results.slice(2,4).flatMap(x=>x.careers??[])).slice(0,10)

    const resultJson={
      results,
      primaryArea:top?.code,
      secondaryArea:second?.code,
      summary:`Tu perfil combina principalmente ${top?.name} y ${second?.name}. Esta combinación señala intereses que conviene contrastar con tus aptitudes, valores, contexto y experiencias reales.`,
      highCompatibility:high,
      mediumCompatibility:medium,
      generatedAt:new Date().toISOString()
    }

    const {data,error}=await db.rpc('finalize_premium_evaluation',{
      p_user_id:user.id,p_test_code:testCode,p_answers:answers,p_scores:scores,p_result:resultJson
    })
    if(error)throw error
    return json(req,{ok:true,evaluationId:data})
  }catch(e:any){
    console.error(e)
    return json(req,{error:e.message??'No se pudo finalizar la evaluación.'},400)
  }
})
