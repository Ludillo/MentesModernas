import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import HomePage from './pages/HomePage'
import TestsPage from './pages/TestsPage'
import VocationalLandingPage from './pages/VocationalLandingPage'
import FreeVocationalPage from './pages/FreeVocationalPage'
import PremiumVocationalPage from './pages/PremiumVocationalPage'
import PremiumTestPage from './pages/PremiumTestPage'
import PremiumResultPage from './pages/PremiumResultPage'
import AuthPage from './pages/AuthPage'
import AccountPage from './pages/AccountPage'
import ContactPage from './pages/ContactPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import GenericTestPage from './pages/GenericTestPage'
import LegalPage from './pages/LegalPage'
import NewsPage from './pages/NewsPage'

export default function App(){
  const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem('mm_seen_splash') !== '1')

  useEffect(()=>{
    if(!showSplash) return
    const t = window.setTimeout(()=>{
      sessionStorage.setItem('mm_seen_splash','1')
      setShowSplash(false)
    }, 2800)
    return ()=> window.clearTimeout(t)
  },[showSplash])

  if(showSplash) return <SplashScreen />

  return <BrowserRouter>
    <Routes>
      <Route element={<Layout/>}>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/tests" element={<TestsPage/>}/>
        <Route path="/tests/vocacional" element={<VocationalLandingPage/>}/>
        <Route path="/tests/vocacional/gratis" element={<FreeVocationalPage/>}/>
        <Route path="/premium/vocacional" element={<PremiumVocationalPage/>}/>
        <Route path="/premium/vocacional/test" element={<PremiumTestPage/>}/>
        <Route path="/resultado/:id" element={<PremiumResultPage/>}/>
        <Route path="/ingresar" element={<AuthPage/>}/>
        <Route path="/cuenta" element={<AccountPage/>}/>
        <Route path="/contacto" element={<ContactPage/>}/>
        <Route path="/noticias" element={<NewsPage/>}/>
        <Route path="/test/:code" element={<GenericTestPage/>}/>
        <Route path="/acceso/:code" element={<PremiumVocationalPage/>}/>
        <Route path="/privacidad" element={<LegalPage/>}/>
        <Route path="/terminos" element={<LegalPage/>}/>
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage/>}/>
      <Route path="/admin" element={<AdminDashboardPage/>}/>
    </Routes>
  </BrowserRouter>
}
