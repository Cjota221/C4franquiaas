'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import {
  Headphones,
  ArrowRight,
  Instagram,
  Phone,
  Clock,
  TrendingUp,
  Check,
  Palette,
  Globe,
  ShoppingBag,
  Heart,
  Star,
  ChevronDown,
  DollarSign,
  Users,
  Boxes,
  Menu,
  X
} from 'lucide-react'

// Hook para animação de scroll reveal
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// Componente de seção com animação
function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal()
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-md' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2">
              <Image 
                src="https://i.ibb.co/20Gxkv48/Design-sem-nome-62.png" 
                alt="C4 Franquias" 
                width={36} 
                height={36}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-base md:text-lg font-bold text-gray-900 leading-tight">C4 Franquias</span>
                <span className="text-[10px] md:text-xs text-pink-600 font-medium -mt-1">by Cjota Rasteirinhas</span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-pink-600 transition font-medium">Como Funciona</a>
              <a href="#vantagens" className="text-gray-600 hover:text-pink-600 transition font-medium">Vantagens</a>
              <a href="#contato" className="text-gray-600 hover:text-pink-600 transition font-medium">Contato</a>
            </nav>
            
            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 font-medium hover:text-pink-600 transition"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro/revendedora"
                className="bg-pink-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-pink-700 transition-all min-h-[44px] flex items-center"
              >
                Cadastre-se
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#como-funciona" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-600 rounded-lg transition"
              >
                Como Funciona
              </a>
              <a 
                href="#vantagens" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-600 rounded-lg transition"
              >
                Vantagens
              </a>
              <a 
                href="#contato" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-600 rounded-lg transition"
              >
                Contato
              </a>
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 px-4 text-center text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro/revendedora"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 px-4 text-center bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition min-h-[44px]"
                >
                  Cadastre-se Grátis
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - CTA inicial */}
      <section className="relative pt-20 pb-8 sm:pb-12 md:pb-16 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-pink-50/50">
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white text-pink-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-sm border border-pink-100">
              <span>🚀 Rede de Franquias Cjota Rasteirinhas</span>
            </div>

            <h1 className="text-[28px] sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.15] mb-4">
              Venda com
              <span className="text-pink-600"> estrutura profissional</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed mb-6 max-w-xl mx-auto">
              O C4 Franquias nasceu para <strong className="text-gray-900">mudar a forma como as revendedoras vendem pela internet.</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/cadastro/revendedora"
                className="group inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-6 py-3.5 rounded-full font-bold text-sm sm:text-base shadow-lg hover:bg-pink-700 active:scale-[0.98] transition-all min-h-[48px]"
              >
                <span>Quero ser franqueada</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3.5 rounded-full font-bold text-sm sm:text-base border-2 border-gray-200 hover:border-pink-600 hover:text-pink-600 active:scale-[0.98] transition-all min-h-[48px]"
              >
                Já sou franqueada
              </Link>
            </div>

            {/* Badge */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pink-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs">C</div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-white font-bold text-xs">J</div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center text-white font-bold text-xs">R</div>
              </div>
              <div className="text-xs text-gray-600">
                <strong className="text-gray-900">+50 franqueadas</strong> já vendendo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 SEÇÃO 1: Vídeo "O que é o C4?" + Texto MENSAGEM 1 */}
      <section id="como-funciona" className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              
              {/* Vídeo à esquerda - formato vertical (stories) */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[280px]">
                  <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
                    {/* Container do vídeo - aspect ratio 9:16 (stories) */}
                    <div className="relative" style={{ paddingBottom: '177.78%' }}>
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://files.catbox.moe/rg19bj.MP4"
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-500 mt-3 text-sm font-medium">O que é o C4?</p>
                </div>
              </div>

              {/* Texto à direita */}
              <div className="lg:pl-8">
                <div className="inline-block px-3 py-1.5 bg-pink-600 text-white rounded-full text-xs font-bold mb-5">
                  🚀 O QUE É O PROJETO C4 FRANQUIAS
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                  Mudar a forma como você <span className="text-pink-600">vende pela internet</span>
                </h2>

                <p className="text-base md:text-lg text-gray-600 mb-5">
                  Hoje, muita gente desiste de empreender por medo de:
                </p>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-start gap-3 bg-red-50/70 border-l-3 border-red-400 p-3 rounded-r-lg">
                    <span className="text-xl">😰</span>
                    <div>
                      <div className="text-red-600 font-bold text-sm">Investir em estoque</div>
                      <p className="text-xs text-gray-600">Comprar produtos antes de vender</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-red-50/70 border-l-3 border-red-400 p-3 rounded-r-lg">
                    <span className="text-xl">📦</span>
                    <div>
                      <div className="text-red-600 font-bold text-sm">Ficar com mercadoria parada</div>
                      <p className="text-xs text-gray-600">Dinheiro investido sem retorno</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-red-50/70 border-l-3 border-red-400 p-3 rounded-r-lg">
                    <span className="text-xl">❌</span>
                    <div>
                      <div className="text-red-600 font-bold text-sm">Não conseguir vender</div>
                      <p className="text-xs text-gray-600">Medo de não ter clientes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-600 text-white p-4 md:p-5 rounded-xl mb-5">
                  <h3 className="text-sm md:text-base font-bold leading-snug">O C4 Franquias é um modelo onde você vende com estrutura profissional, usando os nossos produtos, com muito mais segurança.</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                    </div>
                    <p className="font-semibold text-xs md:text-sm text-gray-700">Profissionalizar vendas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                    </div>
                    <p className="font-semibold text-xs md:text-sm text-gray-700">Reduzir riscos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Globe className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                    </div>
                    <p className="font-semibold text-xs md:text-sm text-gray-700">Estrutura real</p>
                  </div>
                </div>
              </div>

            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 📦 SEÇÃO 2: Vídeo "Pedido e Entrega" + Texto MENSAGEM 2 */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              
              {/* Vídeo à esquerda */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[280px]">
                  <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
                    <div className="relative" style={{ paddingBottom: '177.78%' }}>
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://files.catbox.moe/hzg1c3.MP4"
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-500 mt-3 text-sm font-medium">Pedido e Entrega</p>
                </div>
              </div>

              {/* Texto à direita */}
              <div className="lg:pl-8">
                <div className="inline-block px-3 py-1.5 bg-white border-2 border-pink-500 text-pink-600 rounded-full text-xs font-bold mb-5">
                  📦 COMO FUNCIONA O PEDIDO E A ENTREGA
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight">
                  De forma prática e <span className="text-pink-600">organizada</span>
                </h2>

                <div className="space-y-2.5 mb-6">
                  {[
                    { num: '1', title: 'Cliente acessa seu site', desc: 'Site personalizado com todos os produtos' },
                    { num: '2', title: 'Monta o pedido', desc: 'Navegação fácil e profissional' },
                    { num: '3', title: 'Vai pro WhatsApp', desc: 'Você recebe notificação instantânea' },
                    { num: '4', title: 'Você finaliza e recebe', desc: 'Controla toda a negociação' },
                    { num: '5', title: 'Faz pedido conosco', desc: 'Compra só depois de vender' },
                    { num: '6', title: 'Entrega ao cliente', desc: 'Realiza a entrega final' },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex-shrink-0 w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                        {step.num}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{step.title}</h3>
                        <p className="text-xs text-gray-500">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-pink-600 text-white p-4 rounded-xl">
                  <h3 className="text-base font-bold mb-2">Ou seja:</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <Check className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Você controla a venda</p>
                    </div>
                    <div>
                      <Check className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Você controla o atendimento</p>
                    </div>
                    <div>
                      <Check className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Estrutura profissional</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 💰 SEÇÃO 3: Vídeo "Precisa Pagar?" + Texto MENSAGEM 3 */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              
              {/* Vídeo à esquerda */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[280px]">
                  <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
                    <div className="relative" style={{ paddingBottom: '177.78%' }}>
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://files.catbox.moe/ukwqyj.MP4"
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-500 mt-3 text-sm font-medium">Precisa Pagar?</p>
                </div>
              </div>

              {/* Texto à direita */}
              <div className="lg:pl-8">
                <div className="inline-block px-3 py-1.5 bg-green-600 text-white rounded-full text-xs font-bold mb-5">
                  💰 PRECISA PAGAR PARA ENTRAR NO PROJETO?
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                  <span className="text-green-600">ZERO</span> taxa de entrada
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-green-50 border-2 border-green-500 p-4 rounded-xl text-center">
                    <div className="text-2xl md:text-3xl mb-2">❌</div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">Sem taxa de entrada</h3>
                    <p className="text-xs text-gray-600">Comece agora sem investir nada</p>
                  </div>
                  <div className="bg-green-50 border-2 border-green-500 p-4 rounded-xl text-center">
                    <div className="text-2xl md:text-3xl mb-2">❌</div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">Sem mensalidade</h3>
                    <p className="text-xs text-gray-600">Não paga nada todo mês</p>
                  </div>
                </div>

                <div className="bg-pink-600 text-white p-4 md:p-5 rounded-xl mb-5">
                  <h3 className="text-base md:text-lg font-black mb-2">O Projeto C4 Franquias é GRATUITO</h3>
                  <p className="text-sm opacity-90 mb-1">O único custo acontece quando você vende e faz o pedido dos produtos conosco.</p>
                  <p className="text-base font-bold">Nada antes da venda. ✨</p>
                </div>

                <p className="text-sm md:text-base text-gray-600">
                  O objetivo é <strong className="text-pink-600">crescer junto com as franqueadas</strong>, não criar barreiras para começar.
                </p>
              </div>

            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 🏷️ SEÇÃO 4: Vídeo "Definir Preços" + Texto MENSAGEM 4 */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              
              {/* Vídeo à esquerda */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[280px]">
                  <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
                    <div className="relative" style={{ paddingBottom: '177.78%' }}>
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://files.catbox.moe/495y6q.MP4"
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-500 mt-3 text-sm font-medium">Definir Preços</p>
                </div>
              </div>

              {/* Texto à direita */}
              <div className="lg:pl-8">
                <div className="inline-block px-3 py-1.5 bg-pink-600 text-white rounded-full text-xs font-bold mb-5">
                  🏷️ POSSO ESCOLHER MEU PREÇO?
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight">
                  Sim. <span className="text-pink-600">Você define sua margem</span>
                </h2>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-pink-100 mb-5">
                  <div className="text-center mb-4">
                    <div className="text-2xl md:text-3xl mb-2">💰</div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900">Cada franqueada define a margem de lucro que deseja aplicar</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-xl md:text-2xl mb-1">📉</div>
                      <h4 className="font-bold text-xs mb-0.5">Preço de atacado</h4>
                      <p className="text-gray-500 text-[10px]">Acesso a preços especiais</p>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl mb-1">➕</div>
                      <h4 className="font-bold text-xs mb-0.5">+ Sua margem</h4>
                      <p className="text-gray-500 text-[10px]">Lucro que fizer sentido</p>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl mb-1">🎯</div>
                      <h4 className="font-bold text-xs mb-0.5">= Seu preço final</h4>
                      <p className="text-gray-500 text-[10px]">Valor que seu público aceita</p>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-600 text-white p-4 rounded-xl text-center">
                  <h3 className="text-sm md:text-base font-bold mb-1">Liberdade, estratégia e controle. 🚀</h3>
                  <p className="text-xs md:text-sm opacity-90">Você escolhe quanto quer ganhar em cada venda</p>
                </div>
              </div>

            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 🎨 SEÇÃO 5: Vídeo "Personalização" + Texto MENSAGEM 5 */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              
              {/* Vídeo à esquerda */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[280px]">
                  <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
                    <div className="relative" style={{ paddingBottom: '177.78%' }}>
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://files.catbox.moe/k5n0ja.MP4"
                        playsInline
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-600 mt-3 text-sm md:text-base font-semibold">Personalização</p>
                </div>
              </div>

              {/* Texto à direita */}
              <div className="lg:pl-8 px-2 sm:px-0">
                <div className="inline-block px-3 md:px-4 py-1.5 md:py-2 bg-purple-600 text-white rounded-full text-xs md:text-sm font-bold mb-4 md:mb-6">
                  🎨 PERSONALIZAÇÃO DO SITE
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-6 leading-tight">
                  Um site profissional <span className="text-pink-600">com sua cara</span>
                </h2>

                <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">
                  Cada franqueada recebe um site profissional que pode ser personalizado com:
                </p>

                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                  <div className="bg-gradient-to-br from-pink-50 to-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-pink-200 md:border-2 text-center">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-pink-600 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <Palette className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-xs md:text-base lg:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">Logomarca</h3>
                    <p className="text-[10px] md:text-xs text-gray-600">Sua marca no topo</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-purple-200 md:border-2 text-center">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-600 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <Palette className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-xs md:text-base lg:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">Cores</h3>
                    <p className="text-[10px] md:text-xs text-gray-600">Sua identidade</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-blue-200 md:border-2 text-center">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <Heart className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-xs md:text-base lg:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">Visual</h3>
                    <p className="text-[10px] md:text-xs text-gray-600">Estilo próprio</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-8 rounded-3xl text-center mb-6">
                  <h3 className="text-2xl font-black mb-4">Tudo pensado para:</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Star className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-bold text-sm">Vender mais</p>
                    </div>
                    <div>
                      <Check className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-bold text-sm">Passar credibilidade</p>
                    </div>
                    <div>
                      <Users className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-bold text-sm">Facilitar a compra</p>
                    </div>
                  </div>
                </div>

                <p className="text-lg text-gray-600 text-center">
                  Chega de vender só por <span className="line-through">fotos soltas no WhatsApp</span> ou <span className="line-through">Instagram</span>. 🚫
                </p>
              </div>

            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 📝 SEÇÃO 6: CTA Final - Cadastro */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6">
                ✨ QUER FAZER PARTE DO C4 FRANQUIAS?
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                O cadastro já está disponível
              </h2>

              <p className="text-2xl mb-12 opacity-90">
                Todos os perfis passam por análise e aprovação.
              </p>

              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 p-10 rounded-3xl mb-12">
                <h3 className="text-3xl font-bold mb-6">Por que a análise?</h3>
                <p className="text-xl opacity-90 leading-relaxed">
                  Queremos garantir que cada franqueada tenha o <strong>perfil adequado</strong> e esteja <strong>comprometida</strong> em construir um negócio sério e profissional.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/cadastro/revendedora"
                  className="group relative inline-flex items-center justify-center gap-3 bg-white text-pink-600 px-10 py-5 rounded-full font-black text-xl shadow-2xl hover:bg-gray-50 hover:-translate-y-1 transition-all"
                >
                  <span>FAZER CADASTRO AGORA</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-full font-bold text-xl border-2 border-white/30 hover:bg-white/20 hover:-translate-y-1 transition-all"
                >
                  Já tenho cadastro
                </Link>
              </div>

              <div className="mt-12 flex items-center justify-center gap-4 text-sm opacity-75">
                <Check className="w-5 h-5" />
                <span>Análise em até 24h</span>
                <span>•</span>
                <Check className="w-5 h-5" />
                <span>100% gratuito</span>
                <span>•</span>
                <Check className="w-5 h-5" />
                <span>Sem compromisso</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* O que é o C4 Franquias - ANTIGA (remover depois se necessário) */}
      <section className="py-20 px-4 bg-white" style={{display: 'none'}}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-4 py-2 bg-white border-2 border-pink-600 text-pink-600 rounded-full text-sm font-bold mb-6">
                📦 COMO FUNCIONA O PEDIDO E A ENTREGA
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                De forma prática e <span className="text-pink-600">organizada</span>
              </h2>

              <div className="space-y-6 my-12">
                {[
                  { num: '1', icon: Globe, title: 'O cliente acessa o site da franqueada', desc: 'Seu site personalizado com todos os produtos' },
                  { num: '2', icon: ShoppingBag, title: 'Escolhe os produtos e monta o pedido', desc: 'Navegação fácil e profissional' },
                  { num: '3', icon: Phone, title: 'Pedido vai direto para o WhatsApp da franqueada', desc: 'Você recebe a notificação instantânea' },
                  { num: '4', icon: DollarSign, title: 'A franqueada finaliza a venda e recebe o pagamento', desc: 'Você controla toda a negociação' },
                  { num: '5', icon: Boxes, title: 'Depois disso, a franqueada faz o pedido conosco', desc: 'Compra só depois de vender' },
                  { num: '6', icon: Check, title: 'Nós enviamos os produtos para a franqueada', desc: 'Que realiza a entrega ao cliente final' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 items-start bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-600 to-pink-500 text-white rounded-full flex items-center justify-center font-black text-xl">
                        {step.num}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <step.icon className="w-6 h-6 text-pink-600" />
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-pink-600 text-white p-8 rounded-2xl text-center">
                <h3 className="text-2xl font-bold mb-4">Ou seja:</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Check className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-semibold">Você controla a venda</p>
                  </div>
                  <div>
                    <Check className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-semibold">Você controla o atendimento</p>
                  </div>
                  <div>
                    <Check className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-semibold">Você vende com estrutura profissional</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 💰 MENSAGEM 3 - Precisa pagar para entrar? */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-4 py-2 bg-green-600 text-white rounded-full text-xs font-bold mb-4">
                💰 PRECISA PAGAR PARA ENTRAR?
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">
                <span className="text-green-600">ZERO</span> taxa de entrada
              </h2>

              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
                <div className="bg-white border-2 border-green-500 p-4 md:p-6 rounded-xl">
                  <div className="text-3xl md:text-4xl mb-2">❌</div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Sem taxa</h3>
                  <p className="text-sm text-gray-600">Comece sem investir</p>
                </div>
                <div className="bg-white border-2 border-green-500 p-4 md:p-6 rounded-xl">
                  <div className="text-3xl md:text-4xl mb-2">❌</div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Sem mensalidade</h3>
                  <p className="text-sm text-gray-600">Nada todo mês</p>
                </div>
              </div>

              <div className="bg-green-600 text-white p-6 md:p-8 rounded-2xl mb-6">
                <h3 className="text-lg md:text-xl font-bold mb-2">O C4 Franquias é GRATUITO</h3>
                <p className="text-sm md:text-base opacity-90">Só paga quando vender e fizer o pedido conosco.</p>
                <p className="text-base md:text-lg font-bold mt-3">Nada antes da venda. ✨</p>
              </div>

              <p className="text-sm md:text-base text-gray-600">
                O objetivo é <strong className="text-green-600">crescer junto</strong>, não criar barreiras.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 🏷️ MENSAGEM 4 - Posso escolher meu preço? */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-4 py-2 bg-pink-600 text-white rounded-full text-xs font-bold mb-4">
                🏷️ POSSO ESCOLHER MEU PREÇO?
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">
                Sim. <span className="text-pink-600">Você define sua margem</span>
              </h2>

              <div className="bg-gray-50 p-5 md:p-8 rounded-2xl border border-gray-200 mb-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Você define a margem de lucro</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-6 text-center">
                  <div>
                    <div className="text-2xl md:text-3xl mb-2">📉</div>
                    <h4 className="font-bold text-sm md:text-base mb-1">Atacado</h4>
                    <p className="text-gray-600 text-xs">Preço especial</p>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl mb-2">➕</div>
                    <h4 className="font-bold text-sm md:text-base mb-1">Margem</h4>
                    <p className="text-gray-600 text-xs">Seu lucro</p>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl mb-2">🎯</div>
                    <h4 className="font-bold text-sm md:text-base mb-1">Preço final</h4>
                    <p className="text-gray-600 text-xs">Você decide</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-600 text-white p-5 md:p-6 rounded-xl text-center">
                <h3 className="text-base md:text-lg font-bold mb-1">Liberdade e controle total 🚀</h3>
                <p className="text-sm opacity-90">Escolha quanto quer ganhar em cada venda</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 🎨 MENSAGEM 5 - Personalização do Site */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-bold mb-4">
                🎨 PERSONALIZAÇÃO
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">
                Site profissional <span className="text-purple-600">com sua cara</span>
              </h2>

              <p className="text-sm md:text-base text-gray-600 mb-8">
                Personalize seu site com:
              </p>

              <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-600 rounded-xl flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">Logo</h3>
                  <p className="text-xs text-gray-600">Sua marca no topo</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">Cores</h3>
                  <p className="text-xs text-gray-600">Sua identidade</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">Banners</h3>
                  <p className="text-xs text-gray-600">Estilo próprio</p>
                </div>
              </div>

              <div className="bg-purple-600 text-white p-5 md:p-8 rounded-2xl text-center">
                <h3 className="text-base md:text-lg font-bold mb-4">Padrão pensado para:</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Star className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                    <p className="font-semibold text-xs md:text-sm">Vender mais</p>
                  </div>
                  <div>
                    <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                    <p className="font-semibold text-xs md:text-sm">Credibilidade</p>
                  </div>
                  <div>
                    <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                    <p className="font-semibold text-xs md:text-sm">Fácil comprar</p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                Chega de <span className="line-through">fotos soltas no WhatsApp</span> 🚫
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 📝 MENSAGEM 6 - Cadastro no Projeto */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-pink-600 text-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold mb-4">
                ✨ QUER FAZER PARTE?
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 leading-tight">
                Cadastro disponível
              </h2>

              <p className="text-base md:text-lg mb-8 opacity-90">
                Todos os perfis passam por análise e aprovação.
              </p>

              <div className="bg-white/10 backdrop-blur-sm border border-white/30 p-5 md:p-8 rounded-2xl mb-8">
                <h3 className="text-base md:text-lg font-bold mb-3">Por que a análise?</h3>
                <p className="text-sm md:text-base opacity-90">
                  Queremos garantir que cada franqueada tenha <strong>perfil adequado</strong> e <strong>compromisso</strong>.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <Link
                  href="/cadastro/revendedora"
                  className="group inline-flex items-center justify-center gap-3 bg-white text-pink-600 px-6 py-4 md:px-8 md:py-5 rounded-full font-bold text-base md:text-lg min-h-[52px] shadow-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  <span>FAZER CADASTRO AGORA</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-4 md:px-8 md:py-5 rounded-full font-semibold text-base border border-white/30 min-h-[52px] hover:bg-white/20 active:scale-[0.98] transition-all"
                >
                  Já tenho cadastro
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm opacity-75">
                <span className="flex items-center gap-1"><Check className="w-4 h-4" />Análise em 24h</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Check className="w-4 h-4" />100% gratuito</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* O que é o C4 Franquias */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold mb-3">O que é</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              C4 Franquias<span className="text-pink-600"> é para você</span>
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">Vender rasteirinhas de forma profissional e organizada</p>
          </div>

          {/* Comparativo */}
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-10">
            {/* Sem C4 */}
            <div className="bg-gray-100 p-5 md:p-6 rounded-2xl border border-gray-200">
              <h3 className="text-base font-bold text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">✕</span>
                Sem o C4
              </h3>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>Precisa comprar estoque antes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>Manda foto por foto no WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>Sem organização dos pedidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>Parece amadora para clientes</span>
                </li>
              </ul>
            </div>

            {/* Com C4 */}
            <div className="bg-pink-600 p-5 md:p-6 rounded-2xl text-white">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-pink-600 text-sm">✓</span>
                Com o C4
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span><strong>Sem estoque!</strong> Vende primeiro</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span><strong>Site profissional</strong> com produtos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span><strong>Você define</strong> sua margem</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span><strong>Imagem profissional</strong> sempre</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Veja a Loja Demonstração */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-pink-600 rounded-2xl p-6 md:p-10 text-white text-center">
              <h3 className="text-xl md:text-2xl font-black mb-4">👀 Veja como fica sua loja!</h3>
              <p className="text-sm md:text-base mb-6 opacity-90 max-w-xl mx-auto">
                Acesse nossa loja demonstração e veja na prática.
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                  <div className="text-2xl md:text-3xl mb-2">🎨</div>
                  <h4 className="font-bold text-xs md:text-sm">Design pro</h4>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                  <div className="text-2xl md:text-3xl mb-2">📦</div>
                  <h4 className="font-bold text-xs md:text-sm">Catálogo</h4>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                  <div className="text-2xl md:text-3xl mb-2">🚀</div>
                  <h4 className="font-bold text-xs md:text-sm">Pronto</h4>
                </div>
              </div>

              <a
                href="https://sualoja.c4franquias.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-6 py-4 rounded-full font-bold text-base min-h-[52px] shadow-lg hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <Globe className="w-5 h-5" />
                <span>ACESSAR LOJA DEMO</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-xs opacity-75 mt-4">
                sualoja.c4franquias.com.br
              </p>
            </div>
          </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Como Funciona - Passo a Passo Detalhado */}
      <section id="como-funciona" className="py-8 sm:py-10 md:py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-semibold mb-3">Passo a passo</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3">Como funciona?</h2>
            <p className="text-sm md:text-base text-gray-400">Do cadastro até a primeira venda</p>
          </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {[
              { 
                step: '01', 
                title: 'Faça seu cadastro', 
                description: '100% gratuito', 
                icon: '📝',
                details: ['Análise em 24h', 'Sem compromisso']
              },
              { 
                step: '02', 
                title: 'Receba seu site', 
                description: 'Produtos cadastrados', 
                icon: '🎁',
                details: ['Catálogo completo', 'Design pro']
              },
              { 
                step: '03', 
                title: 'Personalize', 
                description: 'Logo, cores, margem', 
                icon: '🎨',
                details: ['Sua identidade', 'Seus preços']
              },
              { 
                step: '04', 
                title: 'Divulgue e venda!', 
                description: 'Sem estoque', 
                icon: '🚀',
                details: ['WhatsApp auto', 'Lucro garantido']
              }
            ].map((item, index) => (
              <div key={index} className="group">
                <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700 hover:border-pink-500 transition-all h-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 text-xs md:text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="text-2xl md:text-3xl mb-2 md:mb-3">{item.icon}</div>
                  <h3 className="text-sm md:text-base font-bold mb-1 md:mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-xs mb-2 md:mb-3">{item.description}</p>
                  <ul className="space-y-1">
                    {item.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-1 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-pink-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Fluxo da Venda */}
          <div className="bg-pink-600/20 rounded-2xl p-5 md:p-8 border border-pink-500/30">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-base md:text-xl font-bold mb-6 text-center">💡 Fluxo de uma venda</h3>
              <div className="grid grid-cols-5 gap-2 md:gap-4 items-center">
                {[
                  { icon: '👥', text: 'Acessa' },
                  { icon: '🛍️', text: 'Escolhe' },
                  { icon: '💬', text: 'WhatsApp' },
                  { icon: '💰', text: 'Paga' },
                  { icon: '📦', text: 'Entrega' }
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl md:text-3xl mb-1 md:mb-2">{item.icon}</div>
                    <p className="text-xs font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-300 mt-6 text-sm">
                ✨ <strong className="text-white">Zero risco, zero estoque!</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section id="vantagens" className="py-8 sm:py-10 md:py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold mb-3">Vantagens</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              Por que ser<span className="text-pink-600"> Revendedora Pro?</span>
            </h2>
          </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: Boxes, title: 'Sem Estoque', description: 'Venda primeiro, compre depois!', color: 'bg-pink-600' },
              { icon: ShoppingBag, title: 'Produtos Prontos', description: 'Catálogo já cadastrado.', color: 'bg-purple-600' },
              { icon: TrendingUp, title: 'Você Define Lucro', description: 'Escolha sua margem.', color: 'bg-green-600' },
              { icon: Palette, title: 'Totalmente Seu', description: 'Sua marca, suas cores.', color: 'bg-blue-600' },
              { icon: Headphones, title: 'Suporte', description: 'Ajuda pelo WhatsApp.', color: 'bg-orange-500' },
              { icon: Users, title: 'Rede Oficial', description: 'Cjota Rasteirinhas.', color: 'bg-rose-600' }
            ].map((item, index) => (
              <div key={index} className="group bg-white p-4 md:p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <div className={`w-10 h-10 md:w-12 md:h-12 ${item.color} rounded-xl flex items-center justify-center mb-3 md:mb-4`}>
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 md:mb-2">{item.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimento */}
      <section className="py-6 sm:py-8 md:py-10 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center gap-0.5 mb-4">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-base md:text-xl font-medium text-gray-900 mb-6 leading-relaxed px-2">
              &ldquo;Comecei sem estoque e já fiz várias vendas! O site fica lindo e as clientes adoram.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold">A</div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-sm md:text-base">Ana Paula</div>
                <div className="text-gray-500 text-xs md:text-sm">Revendedora Pro</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10 md:py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold mb-2">Dúvidas</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'Preciso comprar estoque antes?', a: 'Não! Você divulga, vende para sua cliente, e só então faz o pedido conosco.' },
              { q: 'O site já vem com os produtos?', a: 'Sim! Seu site já vem com todo o catálogo cadastrado.' },
              { q: 'Como defino minha margem?', a: 'No painel você configura o percentual de lucro.' },
              { q: 'Posso personalizar com minha marca?', a: 'Claro! Cores, logo e seu próprio link.' },
              { q: 'Como funciona o envio?', a: 'Você faz o pedido conosco e nós enviamos para você.' },
              { q: 'Quanto custa para ser Revendedora?', a: 'Cadastro gratuito! Só paga quando fizer pedidos.' }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 hover:bg-pink-50 p-4 md:p-5 rounded-xl transition-colors">
                <h4 className="font-bold text-gray-900 mb-1 md:mb-2 flex items-start gap-2 text-sm md:text-base">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">?</span>
                  {item.q}
                </h4>
                <p className="text-gray-600 pl-7 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-pink-300 px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-pink-500/20">
            <Clock className="w-4 h-4" />
            <span>Cadastro gratuito</span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
            Pronta para vender<span className="block text-pink-400">sem estoque?</span>
          </h2>

          <p className="text-sm md:text-base text-gray-300 mb-8 max-w-xl mx-auto">Junte-se à rede C4 Franquias e comece a vender de forma profissional!</p>

          <Link
            href="/cadastro/revendedora"
            className="group inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-6 py-4 md:px-8 md:py-5 rounded-full font-bold text-base md:text-lg min-h-[52px] shadow-lg hover:bg-pink-700 active:scale-[0.98] transition-all"
          >
            <span>Quero ser revendedora</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-gray-400 text-xs md:text-sm">
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" />Sem estoque</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" />Site pronto</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" />Você define lucro</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-gray-400 py-10 md:py-14 px-5 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
              <Image 
                src="https://i.ibb.co/20Gxkv48/Design-sem-nome-62.png" 
                alt="C4 Franquias" 
                width={40} 
                height={40}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-white leading-tight">C4 Franquias</span>
                <span className="text-xs text-pink-400 font-medium -mt-0.5">by Cjota Rasteirinhas</span>
              </div>
            </div>
            <p className="text-gray-400 mb-4 text-sm max-w-xs">Rede de franquias de calçados femininos. Seu próprio site com produtos prontos!</p>
              <div className="flex gap-3">
                <a href="https://instagram.com/cjotarasteirinhas" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://wa.me/5562981480687" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-pink-400 transition flex items-center gap-1"><ArrowRight className="w-3 h-3" />Área da Revendedora</Link></li>
                <li><Link href="/cadastro/revendedora" className="hover:text-pink-400 transition flex items-center gap-1"><ArrowRight className="w-3 h-3" />Quero ser Revendedora</Link></li>
                <li><Link href="/termos" className="hover:text-pink-400 transition flex items-center gap-1"><ArrowRight className="w-3 h-3" />Termos</Link></li>
                <li><Link href="/privacidade" className="hover:text-pink-400 transition flex items-center gap-1"><ArrowRight className="w-3 h-3" />Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Heart className="w-3 h-3 text-pink-500" />contato@cjotarasteirinhas.com.br</li>
                <li className="flex items-center gap-2"><Phone className="w-3 h-3 text-pink-500" />(62) 98148-0687</li>
                <li className="flex items-center gap-2"><Globe className="w-3 h-3 text-pink-500" />Goiânia - GO</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs">&copy; {new Date().getFullYear()} C4 Franquias by Cjota Rasteirinhas.</p>
            <p className="text-xs flex items-center gap-1">Feito com <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> em Goiânia</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
