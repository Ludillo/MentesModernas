import { corsHeaders, json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'

const AREA_META: Record<string,{name:string,description:string,careers:string[],recommendations:string[]}> = {
  R:{name:'Realista / Técnica',description:'Interés por construir, implementar, operar tecnología y resolver problemas concretos.',careers:['Ingenierías','Arquitectura','Mecánica','Electrónica','Logística','Agronomía'],recommendations:['Explora proyectos técnicos y experiencias prácticas.']},
  I:{name:'Investigativa / Científica',description:'Interés por analizar, investigar, diagnosticar y comprender fenómenos mediante evidencia.',careers:['Medicina','Bioquímica','Ciencia de datos','Informática','Economía','Investigación'],recommendations:['Explora proyectos de investigación y análisis.']},
  A:{name:'Artística / Creativa',description:'Interés por crear, comunicar, innovar y expresar ideas con libertad y sensibilidad estética.',careers:['Diseño','Comunicación','Publicidad','Audiovisual','UX/UI','Arquitectura creativa'],recommendations:['Construye un portafolio con proyectos creativos.']},
  S:{name:'Social / Servicio',description:'Interés por enseñar, cuidar, orientar, escuchar y contribuir al desarrollo de otras personas.',careers:['Psicología','Educación','Enfermería','Trabajo social','Fonoaudiología','Recursos humanos'],recommendations:['Busca experiencias de enseñanza, orientación o servicio.']},
  E:{name:'Emprendedora / Liderazgo',description:'Interés por liderar, negociar, emprender, influir y alcanzar metas con otras personas.',careers:['Administración','Marketing','Derecho','Ventas','Finanzas','Emprendimiento'],recommendations:['Participa en proyectos donde puedas coordinar y decidir.']},
  C:{name:'Convencional / Organización',description:'Interés por organizar información, controlar procesos, trabajar con datos y mantener precisión.',careers:['Contabilidad','Auditoría','Banca','Administración','Seguros','Control de procesos'],recommendations:['Practica con planificación, presupuestos y control de procesos.']},
  VISUAL:{name:'Preferencia de aprendizaje visual',description:'Comprendes y recuerdas mejor mediante imágenes, esquemas, colores, mapas y demostraciones.',careers:[],recommendations:['Convierte tus apuntes en mapas conceptuales.','Usa diagramas, líneas de tiempo y códigos de color.']},
  AUDITORY:{name:'Preferencia de aprendizaje auditivo',description:'Procesas mejor las ideas al escucharlas, explicarlas y conversar sobre ellas.',careers:[],recommendations:['Graba resúmenes breves y escúchalos.','Participa en debates o grupos de estudio.']},
  READING:{name:'Preferencia por lectura y escritura',description:'Aprendes con mayor claridad al leer, tomar apuntes y producir resúmenes escritos.',careers:[],recommendations:['Elabora fichas, glosarios y resúmenes.','Reescribe los conceptos con tus propias palabras.']},
  KINESTHETIC:{name:'Preferencia de aprendizaje práctico',description:'Consolidas el aprendizaje cuando experimentas, practicas y aplicas la teoría en situaciones reales.',careers:[],recommendations:['Transforma la teoría en ejercicios y proyectos.','Estudia en bloques breves con práctica activa.']},
  CREATIVITY:{name:'Creatividad y pensamiento original',description:'Tienes facilidad para imaginar alternativas y proponer soluciones diferentes.',careers:[],recommendations:['Explora varias soluciones antes de elegir.','Registra tus ideas antes de evaluarlas.']},
  EMPATHY:{name:'Empatía y comprensión interpersonal',description:'Reconoces emociones y perspectivas ajenas, favoreciendo relaciones respetuosas.',careers:[],recommendations:['Practica la escucha sin interrumpir.','Confirma lo que comprendiste antes de aconsejar.']},
  DISCIPLINE:{name:'Disciplina y constancia',description:'Puedes sostener compromisos y avanzar incluso cuando disminuye la motivación.',careers:[],recommendations:['Divide objetivos grandes en acciones semanales.','Revisa tu avance con indicadores simples.']},
  LEADERSHIP:{name:'Liderazgo e iniciativa',description:'Tiendes a asumir responsabilidad y ayudar a que un grupo avance hacia metas compartidas.',careers:[],recommendations:['Define expectativas claras y escucha al equipo.','Delega con seguimiento respetuoso.']},
  RESILIENCE:{name:'Resiliencia y adaptación',description:'Cuentas con recursos para recuperarte, aprender de dificultades y adaptarte a cambios.',careers:[],recommendations:['Identifica un aprendizaje concreto después de cada reto.','Pide apoyo oportunamente cuando lo necesites.']},
  COLLABORATION:{name:'Colaboración y trabajo en equipo',description:'Aportas a la confianza, compartes responsabilidades y buscas resultados conjuntos.',careers:[],recommendations:['Aclara acuerdos, funciones y tiempos.','Reconoce los aportes de otras personas.']},
  SOCIAL_COMMUNICATION:{name:'Comunicación e interacción social',description:'Frecuencia con que las conversaciones o señales sociales requieren esfuerzo consciente.',careers:[],recommendations:['Registra situaciones concretas y consulta si existe impacto cotidiano.']},ROUTINES_INTERESTS:{name:'Rutinas e intereses focalizados',description:'Importancia de la previsibilidad, rutinas e intereses intensos.',careers:[],recommendations:['Anticipa cambios y observa el impacto cotidiano.']},SENSORY_PROCESSING:{name:'Procesamiento sensorial',description:'Frecuencia de experiencias sensoriales intensas o necesidad de ajustes.',careers:[],recommendations:['Identifica estímulos que aumentan tu sobrecarga.']},FLEXIBILITY:{name:'Flexibilidad y adaptación',description:'Esfuerzo percibido al cambiar de plan, alternar tareas o afrontar imprevistos.',careers:[],recommendations:['Planifica transiciones y usa apoyos visuales.']},
  INATTENTION:{name:'Atención sostenida',description:'Frecuencia de distracción o dificultad para mantener la atención.',careers:[],recommendations:['Trabaja en bloques breves y consulta si el impacto es persistente.']},HYPERACTIVITY:{name:'Actividad e inquietud',description:'Experiencias de inquietud física o mental y búsqueda de estimulación.',careers:[],recommendations:['Incluye pausas activas planificadas.']},IMPULSIVITY:{name:'Impulsividad y autorregulación',description:'Frecuencia de actuar o hablar antes de valorar consecuencias.',careers:[],recommendations:['Introduce una pausa antes de decisiones importantes.']},EXECUTIVE_FUNCTION:{name:'Organización y funciones ejecutivas',description:'Dificultades percibidas para iniciar, priorizar y finalizar actividades.',careers:[],recommendations:['Usa una agenda visible y define el siguiente paso concreto.']}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)

  try{
    const {user,db}=await requireUser(req)
    const b=await req.json()
    const testCode=String(b.testCode??'')
    const answers=b.answers??{}

    if(!testCode.endsWith('_PREMIUM')) return json(req,{error:'Test inválido.'},400)

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

    const results=Object.keys(counts).filter(code=>counts[code]>0).map(code=>{
      const maxScore=counts[code]*4
      return {
        code,
        name:AREA_META[code]?.name ?? 'Dimensión evaluada',
        score:totals[code],
        maxScore,
        percent:maxScore?Math.round(totals[code]/maxScore*100):0,
        description:AREA_META[code]?.description ?? 'Una de tus dimensiones más destacadas en esta evaluación.',
        careers:AREA_META[code]?.careers ?? [],
        recommendations:AREA_META[code]?.recommendations ?? ['Relaciona este resultado con experiencias concretas de tu vida.']
      }
    }).sort((a,b)=>b.percent-a.percent)

    const scores=Object.fromEntries(results.map(x=>[x.code,{score:x.score,percent:x.percent}]))
    const top=results[0],second=results[1]
    const unique=(arr:string[])=>arr.filter((v,i,a)=>a.indexOf(v)===i)
    const high=unique([...(top?.careers??[]),...(second?.careers??[])]).slice(0,10)
    const medium=unique(results.slice(2,4).flatMap(x=>x.careers??[])).slice(0,10)

    const isVocational=testCode.startsWith('VOCATIONAL_')
    const resultJson={
      results,
      primaryArea:top?.code,
      secondaryArea:second?.code,
      summary:`Tu perfil combina principalmente ${top?.name} y ${second?.name}. Estas preferencias pueden ayudarte a elegir estrategias y experiencias más acordes contigo. Conviene contrastarlas con situaciones reales y con tus objetivos personales.`,
      highCompatibility:isVocational?high:[],
      mediumCompatibility:isVocational?medium:[],
      recommendations:[...(top?.recommendations??[]),...(second?.recommendations??[])],
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
