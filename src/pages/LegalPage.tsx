import { Link, useLocation } from 'react-router-dom'

export default function LegalPage(){
  const privacy=useLocation().pathname.includes('privacidad')
  return <main className="page section legal-page">
    <div className="page-hero compact"><span className="eyebrow">INFORMACIÓN LEGAL</span><h1>{privacy?'Política de Privacidad':'Términos y Condiciones'}</h1><p>Última actualización: 22 de agosto de 2026</p></div>
    {privacy?<article className="legal-card">
      <h2>Información que tratamos</h2><p>MentesModernas utiliza los datos de cuenta que proporcionas —como correo, nombre y avatar— para autenticarte, asociar accesos y conservar tus resultados. Las respuestas de evaluaciones avanzadas se almacenan únicamente para entregarte el servicio solicitado.</p>
      <h2>Finalidad y conservación</h2><p>Usamos la información para operar la plataforma, gestionar pagos y cupones, responder consultas, mejorar la experiencia y proteger el servicio. Conservamos los datos mientras la cuenta esté activa o mientras sean necesarios para cumplir obligaciones legítimas.</p>
      <h2>Google y terceros</h2><p>El acceso con Google solicita solamente información básica de identidad y correo. No accedemos a tus archivos, contactos ni mensajes. Supabase presta servicios de autenticación y almacenamiento; Cloudflare distribuye el sitio.</p>
      <h2>Tus decisiones</h2><p>Puedes solicitar acceso, corrección o eliminación de tus datos mediante el formulario de contacto. No vendemos información personal.</p>
      <h2>Contacto</h2><p>Para consultas de privacidad escribe a ludwingcocajimenez@gmail.com.</p>
    </article>:<article className="legal-card">
      <h2>Naturaleza del servicio</h2><p>Las evaluaciones de MentesModernas son herramientas orientativas de autoconocimiento. No constituyen diagnóstico psicológico, médico ni garantía de admisión, empleo o resultado profesional.</p>
      <h2>Uso responsable</h2><p>El usuario se compromete a proporcionar información auténtica, proteger sus credenciales y utilizar la plataforma de forma lícita. Los accesos avanzados son personales y corresponden al test autorizado.</p>
      <h2>Pagos y accesos</h2><p>Los pagos mediante QR pueden requerir revisión del comprobante. Los cupones están sujetos a vigencia, disponibilidad y condiciones específicas. Un acceso consumido al finalizar una evaluación no puede reutilizarse.</p>
      <h2>Disponibilidad</h2><p>Trabajamos para mantener el servicio disponible y seguro, aunque pueden existir interrupciones por mantenimiento o proveedores externos.</p>
      <h2>Contacto</h2><p>Para consultas sobre estos términos utiliza nuestro <Link to="/contacto">formulario de contacto</Link>.</p>
    </article>}
  </main>
}
