-- Additive seed. Re-running never overwrites an administrator's price or questions.
begin;
do $$ declare t uuid; v uuid; begin
insert into public.test_types(code,name,description,status,icon,sort_order)
values('VOCATIONAL_AI_2026','Test vocacional 2026 · Carreras ante la IA','Explora tus intereses, rutas profesionales y habilidades para trabajar con IA. Evidencia internacional 2025–2026.','ACTIVE','✦',0)
on conflict(code) do nothing;
select id into t from public.test_types where code='VOCATIONAL_AI_2026';
insert into public.test_versions(test_type_id,code,version,access_level,question_count,scoring_model,is_active,instructions)
values(t,'VOCATIONAL_AI_2026_PREMIUM','2026.1','PREMIUM',48,'RIASEC_AI_2026',true,'Responde según tus intereses actuales y hábitos recientes. Las primeras 24 preguntas exploran actividades que te atraen; las siguientes 24, hábitos para aprender y trabajar con IA. No es una prueba de aptitud ni garantiza empleo.') on conflict(code) do nothing;
select id into v from public.test_versions where code='VOCATIONAL_AI_2026_PREMIUM';
insert into public.test_products(code,test_type_id,test_version_id,name,access_level,price,currency,is_active)
values('VOCATIONAL_AI_2026_PREMIUM',t,v,'Test vocacional 2026 · Carreras ante la IA','PREMIUM',45,'BOB',true) on conflict(code) do nothing;
insert into public.test_questions(test_version_id,number,dimension_code,prompt) values
(v,1,'R','Me atrae instalar y comprobar equipos que deben funcionar en condiciones reales.'),
(v,2,'I','Me interesa investigar las causas de un problema antes de proponer una solución.'),
(v,3,'A','Me interesa diseñar experiencias que resulten claras y significativas para otras personas.'),
(v,4,'S','Me interesa acompañar a personas que necesitan atención o apoyo.'),
(v,5,'E','Me interesa coordinar un equipo para llevar una idea a la práctica.'),
(v,6,'C','Me interesa revisar información para encontrar errores o inconsistencias.'),
(v,7,'R','Disfrutaría investigar por qué una máquina o un dispositivo dejó de funcionar.'),
(v,8,'I','Disfrutaría comparar datos para comprobar si una explicación es correcta.'),
(v,9,'A','Disfrutaría crear propuestas visuales o narrativas con un punto de vista propio.'),
(v,10,'S','Disfrutaría enseñar un tema y adaptar la explicación a quien aprende.'),
(v,11,'E','Disfrutaría negociar acuerdos entre personas con prioridades diferentes.'),
(v,12,'C','Disfrutaría organizar recursos y plazos para que un proceso sea confiable.'),
(v,13,'R','Me interesa trabajar con herramientas para construir o reparar objetos.'),
(v,14,'I','Me atrae diseñar experimentos y revisar qué significan sus resultados.'),
(v,15,'A','Me atrae explorar varias ideas antes de elegir una solución de diseño.'),
(v,16,'S','Me atrae trabajar directamente con personas para mejorar su bienestar.'),
(v,17,'E','Me atrae detectar necesidades y desarrollar un servicio para resolverlas.'),
(v,18,'C','Me atrae comprobar que un trabajo cumple criterios de calidad.'),
(v,19,'R','Me gustaría mejorar sistemas de energía, agua o producción mediante trabajo práctico.'),
(v,20,'I','Me gustaría estudiar problemas científicos o tecnológicos aunque no tengan una respuesta inmediata.'),
(v,21,'A','Me gustaría transformar necesidades poco claras en un prototipo creativo.'),
(v,22,'S','Me gustaría comprender las necesidades de una comunidad antes de intervenir.'),
(v,23,'E','Me gustaría asumir decisiones y responsabilidad por el avance de un proyecto.'),
(v,24,'C','Me gustaría mantener registros precisos que permitan justificar una decisión.'),
(v,25,'AI_LITERACY','Cuando uso o pruebo IA, comparo su respuesta con información verificable.'),
(v,26,'JUDGMENT','Busco la fuente original cuando una afirmación influye en una decisión importante.'),
(v,27,'HUMAN','Compruebo que entendí a otra persona antes de ofrecer una solución.'),
(v,28,'ADAPT','Puedo mantener una rutina breve para aprender algo nuevo.'),
(v,29,'ETHICS','Antes de automatizar una decisión, pienso quién podría verse perjudicado.'),
(v,30,'SYSTEMS','Me interesa entender cómo un cambio en una parte afecta al resto de un proceso.'),
(v,31,'AI_LITERACY','Puedo describir con claridad una tarea antes de pedir ayuda a una herramienta digital.'),
(v,32,'JUDGMENT','Cambio mi explicación cuando encuentro evidencia que la contradice.'),
(v,33,'HUMAN','Adapto mi explicación cuando alguien no conoce los términos que utilizo.'),
(v,34,'ADAPT','Uso los comentarios sobre mi trabajo para intentar una mejora concreta.'),
(v,35,'ETHICS','Reconozco cuándo una tarea requiere la revisión de una persona cualificada.'),
(v,36,'SYSTEMS','Al proponer una mejora, considero el tiempo y los recursos que exige mantenerla.'),
(v,37,'AI_LITERACY','Antes de introducir información en una IA, reviso si contiene datos privados.'),
(v,38,'JUDGMENT','Distingo entre un dato observado y una suposición al resolver un problema.'),
(v,39,'HUMAN','Puedo expresar un desacuerdo sin dejar de escuchar a la otra persona.'),
(v,40,'ADAPT','Si una herramienta cambia, busco una manera de aprender lo necesario.'),
(v,41,'ETHICS','Me importa poder explicar por qué se tomó una decisión asistida por tecnología.'),
(v,42,'SYSTEMS','Pienso en necesidades locales antes de copiar una solución usada en otro país.'),
(v,43,'AI_LITERACY','Me interesa practicar con herramientas de IA y comprobar dónde se equivocan.'),
(v,44,'JUDGMENT','Comparo alternativas antes de aceptar la primera solución que parece funcionar.'),
(v,45,'HUMAN','Cuando colaboro, aclaro responsabilidades y pido ayuda si la necesito.'),
(v,46,'ADAPT','Pruebo una estrategia diferente cuando la anterior no me permite avanzar.'),
(v,47,'ETHICS','Reviso si tengo permiso para utilizar datos o materiales de otras personas.'),
(v,48,'SYSTEMS','Me interesa relacionar decisiones tecnológicas con su impacto social y ambiental.')
on conflict(test_version_id,number) do nothing;
end $$;
commit;
