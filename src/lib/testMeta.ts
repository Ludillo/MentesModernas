export const TEST_META:Record<string,{title:string;shortTitle:string;premiumCode?:string;notice?:string}>={
  VOCATIONAL_FREE:{title:'Orientación Vocacional Gratuita',shortTitle:'Orientación Vocacional',premiumCode:'VOCATIONAL_PREMIUM'},
  VOCATIONAL_PREMIUM:{title:'Perfil Vocacional Avanzado',shortTitle:'Orientación Vocacional'},
  LEARNING_STYLE_FREE:{title:'Estilo de Aprendizaje Gratuito',shortTitle:'Estilo de Aprendizaje',premiumCode:'LEARNING_STYLE_PREMIUM'},
  LEARNING_STYLE_PREMIUM:{title:'Estilo de Aprendizaje Avanzado',shortTitle:'Estilo de Aprendizaje'},
  PERSONAL_STRENGTHS_FREE:{title:'Fortalezas Personales Gratuito',shortTitle:'Fortalezas Personales',premiumCode:'PERSONAL_STRENGTHS_PREMIUM'},
  PERSONAL_STRENGTHS_PREMIUM:{title:'Fortalezas Personales Avanzado',shortTitle:'Fortalezas Personales'},
  AUTISM_TRAITS_FREE:{title:'Exploración de indicadores TEA en adultos · Gratuita',shortTitle:'Indicadores de TEA en adultos',premiumCode:'AUTISM_TRAITS_PREMIUM',notice:'Esta autoexploración no diagnostica autismo. Sólo organiza experiencias percibidas y puede ayudarte a decidir si deseas conversar con un profesional cualificado.'},
  AUTISM_TRAITS_PREMIUM:{title:'Exploración de indicadores TEA en adultos · Avanzada',shortTitle:'Indicadores de TEA en adultos',notice:'Este informe no confirma ni descarta autismo y no sustituye una evaluación clínica integral.'},
  ADHD_TRAITS_FREE:{title:'Exploración de indicadores TDAH en adultos · Gratuita',shortTitle:'Indicadores de TDAH en adultos',premiumCode:'ADHD_TRAITS_PREMIUM',notice:'Esta autoexploración no diagnostica TDAH. La frecuencia de estas experiencias también puede relacionarse con sueño, estrés, ansiedad, depresión u otras condiciones.'},
  ADHD_TRAITS_PREMIUM:{title:'Exploración de indicadores TDAH en adultos · Avanzada',shortTitle:'Indicadores de TDAH en adultos',notice:'Este informe no confirma ni descarta TDAH y no sustituye una evaluación clínica integral.'}
}

export function testMeta(code:string){return TEST_META[code]??{title:'Evaluación personal',shortTitle:'Evaluación personal'}}
