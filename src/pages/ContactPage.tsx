import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({name:'',email:'',phone:'',message:''})
  const [status, setStatus] = useState('')

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setStatus('Enviando...')
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-contact`, {
      method:'POST',
      headers:{'Content-Type':'application/json',apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify(form)
    })
    setStatus(res.ok ? '¡Gracias! Recibimos tu mensaje.' : 'No fue posible enviar el mensaje.')
    if(res.ok) setForm({name:'',email:'',phone:'',message:''})
  }

  return (
    <main className="page section">
      <div className="contact-layout">
        <section>
          <span className="eyebrow">CONTÁCTATE CON NOSOTROS</span>
          <h1>¿Tienes una pregunta o necesitas orientación?</h1>
          <p>Escríbenos y revisaremos tu mensaje desde el panel de MentesModernas.</p>
          <div className="contact-highlight">💬 También puedes habilitar aquí el WhatsApp oficial cuando tengas el número definitivo.</div>
        </section>
        <form className="contact-form" onSubmit={submit}>
          <label>Nombre<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Correo<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Celular<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Mensaje<textarea required rows={6} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label>
          <button className="btn primary full">Enviar mensaje</button>
          {status && <div className="alert">{status}</div>}
        </form>
      </div>
    </main>
  )
}
