-- Calidad de contenido: bancos independientes, equilibrados y sin preguntas repetidas.
-- Esta migración reemplaza los seis cuestionarios activos conservando sus códigos y productos.

create temporary table mm_question_bank(test_code text, number int, dimension_code text, prompt text) on commit drop;

insert into mm_question_bank values
-- Orientación vocacional gratuita: 35 preguntas diferentes de la versión Premium.
('VOCATIONAL_FREE',1,'R','Me entusiasma convertir una idea en un objeto, prototipo o solución que pueda probar.'),
('VOCATIONAL_FREE',2,'I','Cuando algo no funciona, disfruto investigar sus causas antes de proponer una respuesta.'),
('VOCATIONAL_FREE',3,'A','Me inspira combinar colores, palabras, sonidos o formas para comunicar una idea propia.'),
('VOCATIONAL_FREE',4,'S','Me siento útil cuando ayudo a alguien a comprender una situación o tomar una decisión.'),
('VOCATIONAL_FREE',5,'E','Me motiva presentar una propuesta y conseguir que otras personas se sumen a ella.'),
('VOCATIONAL_FREE',6,'C','Disfruto crear listas, calendarios o métodos para que una actividad funcione con orden.'),
('VOCATIONAL_FREE',7,'R','Prefiero aprender cómo funciona algo utilizándolo, desmontándolo o probándolo.'),
('VOCATIONAL_FREE',8,'I','Me atraen las preguntas que requieren observar datos y comparar explicaciones posibles.'),
('VOCATIONAL_FREE',9,'A','Suelo imaginar maneras poco comunes de presentar un mensaje o resolver una necesidad.'),
('VOCATIONAL_FREE',10,'S','Tengo paciencia para escuchar un problema personal y acompañar sin juzgar.'),
('VOCATIONAL_FREE',11,'E','Me resulta estimulante organizar personas y recursos para cumplir un objetivo desafiante.'),
('VOCATIONAL_FREE',12,'C','Me da satisfacción detectar y corregir errores en documentos, cálculos o registros.'),
('VOCATIONAL_FREE',13,'R','Me interesaría participar en la instalación o mantenimiento de equipos y espacios.'),
('VOCATIONAL_FREE',14,'I','Disfruto aprender conceptos complejos hasta poder explicarlos con precisión.'),
('VOCATIONAL_FREE',15,'A','Me gustaría desarrollar proyectos donde pueda experimentar con mi propio estilo.'),
('VOCATIONAL_FREE',16,'S','Me atraen actividades donde el progreso de otras personas sea parte del resultado.'),
('VOCATIONAL_FREE',17,'E','Detecto oportunidades y pienso rápidamente en cómo convertirlas en un proyecto viable.'),
('VOCATIONAL_FREE',18,'C','Prefiero que las responsabilidades, fechas y criterios de una tarea estén claramente definidos.'),
('VOCATIONAL_FREE',19,'R','Me siento cómodo resolviendo dificultades mediante acciones concretas y herramientas adecuadas.'),
('VOCATIONAL_FREE',20,'I','Me gustaría analizar muestras, información o comportamientos para descubrir patrones.'),
('VOCATIONAL_FREE',21,'A','Disfruto transformar un concepto sencillo en una experiencia atractiva y memorable.'),
('VOCATIONAL_FREE',22,'S','Me interesa facilitar la cooperación cuando varias personas tienen necesidades distintas.'),
('VOCATIONAL_FREE',23,'E','Me veo defendiendo una iniciativa frente a clientes, aliados o responsables de una organización.'),
('VOCATIONAL_FREE',24,'C','Puedo concentrarme durante bastante tiempo en tareas que exigen exactitud y seguimiento.'),
('VOCATIONAL_FREE',25,'R','Me atraen los entornos donde se construye, produce, cultiva, transporta o repara.'),
('VOCATIONAL_FREE',26,'I','Antes de aceptar una afirmación importante, busco fuentes y evidencias que la respalden.'),
('VOCATIONAL_FREE',27,'A','Me entusiasma contar historias o provocar emociones a través de una creación.'),
('VOCATIONAL_FREE',28,'S','Disfruto adaptar una explicación al ritmo y las necesidades de quien está aprendiendo.'),
('VOCATIONAL_FREE',29,'E','Me siento capaz de tomar decisiones oportunas cuando un equipo necesita avanzar.'),
('VOCATIONAL_FREE',30,'C','Me interesaría administrar información, recursos o movimientos de una operación.'),
('VOCATIONAL_FREE',31,'R','Valoro los trabajos en los que puedo observar claramente lo que logré al terminar.'),
('VOCATIONAL_FREE',32,'I','Me estimulan los desafíos intelectuales que no tienen una respuesta inmediata.'),
('VOCATIONAL_FREE',33,'A','Prefiero tener margen para explorar alternativas en vez de copiar una solución existente.'),
('VOCATIONAL_FREE',34,'S','Quisiera que mi trabajo contribuya a mejorar la calidad de vida de personas o grupos.'),
('VOCATIONAL_FREE',35,'E','Me atrae asumir responsabilidad por los resultados de una iniciativa propia.'),

-- Estilo de aprendizaje gratuito.
('LEARNING_STYLE_FREE',1,'VISUAL','Retengo mejor una explicación cuando está acompañada por un esquema claro.'),
('LEARNING_STYLE_FREE',2,'AUDITORY','Comprendo una idea con mayor facilidad cuando la escucho explicada paso a paso.'),
('LEARNING_STYLE_FREE',3,'READING','Ordenar un tema en apuntes escritos me ayuda a entenderlo.'),
('LEARNING_STYLE_FREE',4,'KINESTHETIC','Necesito realizar ejercicios para sentir que realmente aprendí un procedimiento.'),
('LEARNING_STYLE_FREE',5,'VISUAL','Los colores y símbolos me ayudan a distinguir conceptos relacionados.'),
('LEARNING_STYLE_FREE',6,'AUDITORY','Recordar una conversación sobre el tema me ayuda durante una evaluación.'),
('LEARNING_STYLE_FREE',7,'READING','Prefiero consultar instrucciones detalladas antes de comenzar una actividad.'),
('LEARNING_STYLE_FREE',8,'KINESTHETIC','Aprendo mejor cuando puedo manipular materiales o probar una herramienta.'),
('LEARNING_STYLE_FREE',9,'VISUAL','Una línea de tiempo me permite comprender mejor una secuencia de hechos.'),
('LEARNING_STYLE_FREE',10,'AUDITORY','Explicar el contenido en voz alta me permite detectar lo que aún no comprendo.'),
('LEARNING_STYLE_FREE',11,'READING','Elaborar un resumen con mis propias palabras fortalece mi memoria.'),
('LEARNING_STYLE_FREE',12,'KINESTHETIC','Relacionar la teoría con una situación real mantiene mi atención.'),

-- Estilo de aprendizaje Premium: banco completamente independiente.
('LEARNING_STYLE_PREMIUM',1,'VISUAL','Identifico con rapidez la idea principal cuando la información está organizada en un mapa.'),
('LEARNING_STYLE_PREMIUM',2,'AUDITORY','Las variaciones de tono de quien explica me ayudan a reconocer lo más importante.'),
('LEARNING_STYLE_PREMIUM',3,'READING','Me resulta útil subrayar y anotar preguntas mientras leo un contenido nuevo.'),
('LEARNING_STYLE_PREMIUM',4,'KINESTHETIC','Comprendo un proceso cuando lo ejecuto por etapas y corrijo sobre la marcha.'),
('LEARNING_STYLE_PREMIUM',5,'VISUAL','Puedo reconstruir una explicación recordando dónde estaba cada elemento en una imagen.'),
('LEARNING_STYLE_PREMIUM',6,'AUDITORY','Una clase dialogada mantiene mi concentración más que una lectura silenciosa extensa.'),
('LEARNING_STYLE_PREMIUM',7,'READING','Crear definiciones breves me ayuda a diferenciar términos parecidos.'),
('LEARNING_STYLE_PREMIUM',8,'KINESTHETIC','Los simuladores y demostraciones interactivas facilitan mi aprendizaje.'),
('LEARNING_STYLE_PREMIUM',9,'VISUAL','Prefiero ver un ejemplo resuelto antes de leer una explicación larga.'),
('LEARNING_STYLE_PREMIUM',10,'AUDITORY','Hacer preguntas y escuchar respuestas aclara mis dudas con rapidez.'),
('LEARNING_STYLE_PREMIUM',11,'READING','Organizo mejor mis ideas cuando preparo una guía escrita del tema.'),
('LEARNING_STYLE_PREMIUM',12,'KINESTHETIC','Los descansos con movimiento me ayudan a recuperar la concentración.'),
('LEARNING_STYLE_PREMIUM',13,'VISUAL','Las tablas comparativas me permiten reconocer semejanzas y diferencias.'),
('LEARNING_STYLE_PREMIUM',14,'AUDITORY','Recuerdo frases clave cuando las repito con ritmo o entonación.'),
('LEARNING_STYLE_PREMIUM',15,'READING','Consultar varias fuentes escritas me ayuda a construir una explicación completa.'),
('LEARNING_STYLE_PREMIUM',16,'KINESTHETIC','Me siento seguro con un contenido después de aplicarlo en un caso concreto.'),
('LEARNING_STYLE_PREMIUM',17,'VISUAL','Imaginar mentalmente un proceso me ayuda a recordar sus pasos.'),
('LEARNING_STYLE_PREMIUM',18,'AUDITORY','Estudiar con otra persona y turnarnos para explicar mejora mi comprensión.'),
('LEARNING_STYLE_PREMIUM',19,'READING','Transformar una explicación en preguntas escritas me sirve para repasar.'),
('LEARNING_STYLE_PREMIUM',20,'KINESTHETIC','Aprendo de mis errores cuando recibo retroalimentación inmediata durante la práctica.'),
('LEARNING_STYLE_PREMIUM',21,'VISUAL','Un tablero con objetivos visibles me ayuda a seguir mi progreso.'),
('LEARNING_STYLE_PREMIUM',22,'AUDITORY','Escuchar un resumen después de estudiar refuerza lo que considero esencial.'),
('LEARNING_STYLE_PREMIUM',23,'READING','Preparar una explicación escrita revela vacíos en mi conocimiento.'),
('LEARNING_STYLE_PREMIUM',24,'KINESTHETIC','Crear un producto o proyecto es mi forma más efectiva de integrar varios conceptos.'),

-- Fortalezas personales gratuita.
('PERSONAL_STRENGTHS_FREE',1,'CREATIVITY','Genero varias alternativas cuando la primera solución no funciona.'),
('PERSONAL_STRENGTHS_FREE',2,'EMPATHY','Noto cambios en el ánimo de las personas cercanas.'),
('PERSONAL_STRENGTHS_FREE',3,'DISCIPLINE','Cumplo tareas importantes aunque resulten poco entretenidas.'),
('PERSONAL_STRENGTHS_FREE',4,'LEADERSHIP','Propongo un camino cuando un grupo no sabe cómo comenzar.'),
('PERSONAL_STRENGTHS_FREE',5,'RESILIENCE','Después de un error, puedo concentrarme en lo que haré diferente.'),
('PERSONAL_STRENGTHS_FREE',6,'COLLABORATION','Comparto información que puede facilitar el trabajo de mi equipo.'),
('PERSONAL_STRENGTHS_FREE',7,'CREATIVITY','Relaciono ideas de temas distintos para producir algo nuevo.'),
('PERSONAL_STRENGTHS_FREE',8,'EMPATHY','Procuro comprender una perspectiva diferente antes de responder.'),
('PERSONAL_STRENGTHS_FREE',9,'DISCIPLINE','Organizo mi tiempo para avanzar antes de que se acerque una fecha límite.'),
('PERSONAL_STRENGTHS_FREE',10,'LEADERSHIP','Puedo comunicar una meta de forma que otras personas entiendan su importancia.'),
('PERSONAL_STRENGTHS_FREE',11,'RESILIENCE','Me adapto cuando un plan cambia de manera inesperada.'),
('PERSONAL_STRENGTHS_FREE',12,'COLLABORATION','Busco acuerdos que permitan aprovechar las capacidades de cada integrante.'),

-- Fortalezas personales Premium: banco completamente independiente.
('PERSONAL_STRENGTHS_PREMIUM',1,'CREATIVITY','Cuestiono las suposiciones habituales para descubrir nuevas posibilidades.'),
('PERSONAL_STRENGTHS_PREMIUM',2,'EMPATHY','Escucho con atención incluso cuando no comparto la opinión de otra persona.'),
('PERSONAL_STRENGTHS_PREMIUM',3,'DISCIPLINE','Mantengo hábitos útiles sin depender únicamente de la motivación del momento.'),
('PERSONAL_STRENGTHS_PREMIUM',4,'LEADERSHIP','Asumo responsabilidad por una decisión que afecta al grupo.'),
('PERSONAL_STRENGTHS_PREMIUM',5,'RESILIENCE','Conservo la perspectiva cuando atravieso una situación exigente.'),
('PERSONAL_STRENGTHS_PREMIUM',6,'COLLABORATION','Pido y ofrezco retroalimentación de manera respetuosa.'),
('PERSONAL_STRENGTHS_PREMIUM',7,'CREATIVITY','Puedo mejorar una idea existente sin perder su propósito principal.'),
('PERSONAL_STRENGTHS_PREMIUM',8,'EMPATHY','Adapto mi forma de comunicarme según las necesidades de quien me escucha.'),
('PERSONAL_STRENGTHS_PREMIUM',9,'DISCIPLINE','Divido un objetivo complejo en pasos medibles y alcanzables.'),
('PERSONAL_STRENGTHS_PREMIUM',10,'LEADERSHIP','Ayudo a establecer prioridades cuando existen varias demandas urgentes.'),
('PERSONAL_STRENGTHS_PREMIUM',11,'RESILIENCE','Puedo pedir ayuda sin interpretar eso como un fracaso personal.'),
('PERSONAL_STRENGTHS_PREMIUM',12,'COLLABORATION','Reconozco públicamente los aportes de otras personas al resultado.'),
('PERSONAL_STRENGTHS_PREMIUM',13,'CREATIVITY','Disfruto experimentar con enfoques diferentes antes de elegir uno.'),
('PERSONAL_STRENGTHS_PREMIUM',14,'EMPATHY','Puedo identificar lo que alguien necesita aunque no lo exprese con claridad.'),
('PERSONAL_STRENGTHS_PREMIUM',15,'DISCIPLINE','Reviso mi progreso y ajusto mi planificación cuando es necesario.'),
('PERSONAL_STRENGTHS_PREMIUM',16,'LEADERSHIP','Facilito que las personas participen antes de tomar una decisión grupal.'),
('PERSONAL_STRENGTHS_PREMIUM',17,'RESILIENCE','Encuentro aprendizajes útiles incluso en experiencias que no salieron como esperaba.'),
('PERSONAL_STRENGTHS_PREMIUM',18,'COLLABORATION','Puedo ceder protagonismo cuando otra persona está mejor preparada para una tarea.'),
('PERSONAL_STRENGTHS_PREMIUM',19,'CREATIVITY','Imagino cómo podría evolucionar una solución en diferentes escenarios.'),
('PERSONAL_STRENGTHS_PREMIUM',20,'EMPATHY','Considero el impacto emocional de mis decisiones en otras personas.'),
('PERSONAL_STRENGTHS_PREMIUM',21,'DISCIPLINE','Protejo tiempo para mis prioridades y reduzco distracciones.'),
('PERSONAL_STRENGTHS_PREMIUM',22,'LEADERSHIP','Mantengo la calma y doy orientación clara cuando aparece un problema.'),
('PERSONAL_STRENGTHS_PREMIUM',23,'RESILIENCE','Recupero gradualmente mi energía después de periodos de presión.'),
('PERSONAL_STRENGTHS_PREMIUM',24,'COLLABORATION','Contribuyo a resolver desacuerdos enfocando al equipo en el objetivo común.');

delete from public.test_questions q
using public.test_versions v
where q.test_version_id=v.id and v.code in (
  'VOCATIONAL_FREE','LEARNING_STYLE_FREE','LEARNING_STYLE_PREMIUM',
  'PERSONAL_STRENGTHS_FREE','PERSONAL_STRENGTHS_PREMIUM'
);

insert into public.test_questions(test_version_id,number,dimension_code,prompt,is_active)
select v.id,b.number,b.dimension_code,b.prompt,true
from mm_question_bank b join public.test_versions v on v.code=b.test_code
order by b.test_code,b.number;

update public.test_versions v set question_count=x.total
from (select test_code,count(*)::int total from mm_question_bank group by test_code) x
where v.code=x.test_code;

-- Evita que futuras ediciones administrativas introduzcan duplicados exactos.
create unique index if not exists uq_test_questions_version_prompt
on public.test_questions(test_version_id,lower(btrim(prompt)));

