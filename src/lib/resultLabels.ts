const LABELS:Record<string,{name:string;description:string}>={
  VISUAL:{name:'Aprendizaje visual',description:'Comprendes mejor mediante imágenes, diagramas, mapas y demostraciones.'},
  AUDITORY:{name:'Aprendizaje auditivo',description:'Asimilas mejor las ideas al escuchar explicaciones y conversar sobre ellas.'},
  READING:{name:'Lectura y escritura',description:'Aprendes organizando información mediante textos, apuntes y resúmenes.'},
  KINESTHETIC:{name:'Aprendizaje práctico',description:'Comprendes mejor mediante la experiencia, la práctica y el movimiento.'},
  CREATIVITY:{name:'Creatividad',description:'Encuentras perspectivas originales y nuevas formas de resolver problemas.'},
  EMPATHY:{name:'Empatía',description:'Reconoces y comprendes con sensibilidad las emociones de otras personas.'},
  DISCIPLINE:{name:'Disciplina',description:'Mantienes constancia, organización y compromiso con tus objetivos.'},
  LEADERSHIP:{name:'Liderazgo',description:'Tomas iniciativa y ayudas a orientar a los grupos hacia objetivos comunes.'},
  RESILIENCE:{name:'Resiliencia',description:'Te adaptas, aprendes y recuperas después de situaciones difíciles.'},
  COLLABORATION:{name:'Colaboración',description:'Construyes confianza y contribuyes positivamente al trabajo en equipo.'}
}

export function resultMeta(code:string){return LABELS[code]??{name:code.replaceAll('_',' ').toLocaleLowerCase('es'),description:'Esta dimensión representa una parte relevante de tu perfil.'}}
