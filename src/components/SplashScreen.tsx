import { useEffect, useState } from 'react'
import splashImage from '../assets/brain-splash.png'

export default function SplashScreen(){
  const [progress, setProgress] = useState(12)

  useEffect(()=>{
    const timer = setInterval(()=>{
      setProgress(prev => prev >= 100 ? 100 : prev + Math.ceil((100 - prev) * 0.18))
    }, 180)
    return ()=> clearInterval(timer)
  },[])

  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <img src={splashImage} alt="MentesModernas intro" className="splash-screen__bg" />
      <div className="splash-screen__overlay" />
      <div className="splash-screen__content">
        <div className="splash-badge">NEURO · TECH · DISCOVERY</div>
        <h1>MentesModernas</h1>
        <p>Despierta tu mente. Diseña tu futuro.</p>
        <div className="splash-progress-wrap">
          <span>Cargando experiencia inmersiva…</span>
          <div className="splash-progress"><div style={{width:`${progress}%`}} /></div>
          <strong>{progress}%</strong>
        </div>
      </div>
    </div>
  )
}
