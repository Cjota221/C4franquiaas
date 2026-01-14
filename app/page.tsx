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
  Boxes
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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2">
              <Image 
                src="https://i.ibb.co/20Gxkv48/Design-sem-nome-62.png" 
                alt="C4 Franquias" 
                width={40} 
                height={40}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight">C4 Franquias</span>
                <span className="text-xs text-pink-600 font-medium -mt-1">by Cjota Rasteirinhas</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-pink-600 transition font-medium">Como Funciona</a>
              <a href="#vantagens" className="text-gray-600 hover:text-pink-600 transition font-medium">Vantagens</a>
              <a href="#contato" className="text-gray-600 hover:text-pink-600 transition font-medium">Contato</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 font-medium hover:text-pink-600 transition text-sm sm:text-base"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro/revendedora"
                className="bg-pink-600 text-white px-4 sm:px-6 py-2 rounded-full font-semibold hover:bg-pink-700 transition-all text-sm sm:text-base"
              >
                Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section com Vídeos + Texto */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Lado Esquerdo - Grid de Vídeos */}
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { title: 'O que é o C4?', url: 'https://files.catbox.moe/rg19bj.MP4' },
                  { title: 'Pedido e Entrega', url: 'https://files.catbox.moe/hzg1c3.MP4' },
                  { title: 'Precisa Pagar?', url: 'https://files.catbox.moe/ukwqyj.MP4' },
                  { title: 'Definir Preços', url: 'https://files.catbox.moe/495y6q.MP4' },
                  { title: 'Personalização', url: 'https://files.catbox.moe/k5n0ja.MP4' }
                ].map((video, index) => (
                  <div 
                    key={index} 
                    className={`group relative ${index === 4 ? 'col-span-3' : ''}`}
                  >
                    <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-pink-500 transition-all duration-300 shadow-lg hover:shadow-pink-500/20">
                      {/* Container do vídeo com aspect ratio de Stories (9:16) */}
                      <div className="relative" style={{ paddingBottom: index === 4 ? '56.25%' : '177.78%' }}>
                        <video
                          className="absolute inset-0 w-full h-full object-cover"
                          src={video.url}
                          playsInline
                          muted
                          loop
                          preload="metadata"
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          onTouchStart={(e) => e.currentTarget.play()}
                          onTouchEnd={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                        {/* Overlay com gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        {/* Ícone de play */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      {/* Título do vídeo */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                        <h3 className="text-white font-bold text-xs leading-tight">{video.title}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Badge de destaque abaixo dos vídeos */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-600 border-2 border-white flex items-center justify-center text-white font-bold">C</div>
                  <div className="w-10 h-10 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-white font-bold">J</div>
                  <div className="w-10 h-10 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center text-white font-bold">R</div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong className="text-gray-900">+50 franqueadas</strong> já vendendo
                </div>
              </div>
            </div>

            {/* Lado Direito - Texto */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-white text-pink-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-pink-100">
                <span>🚀 Rede de Franquias Cjota Rasteirinhas</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] mb-6">
                Venda com
                <span className="block mt-2 text-pink-600">
                  estrutura profissional
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8">
                O C4 Franquias nasceu para <strong className="text-gray-900">mudar a forma como as revendedoras vendem pela internet.</strong>
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                  <p className="text-lg text-gray-700">Venda <strong>sem investir em estoque</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                  <p className="text-lg text-gray-700">Tenha um <strong>site profissional personalizado</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                  <p className="text-lg text-gray-700">Defina <strong>sua margem de lucro</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                  <p className="text-lg text-gray-700"><strong>Zero taxa de entrada ou mensalidade</strong></p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/cadastro/revendedora"
                  className="group relative inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-pink-700 hover:-translate-y-1 transition-all"
                >
                  <span>Quero ser franqueada</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-200 hover:border-pink-600 hover:text-pink-600 hover:-translate-y-1 transition-all shadow-sm"
                >
                  Já sou franqueada
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* 🔥 MENSAGEM 1 - O que é o Projeto C4 Franquias */}
      <section id="como-funciona" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-full text-sm font-bold mb-6">
                🚀 O QUE É O PROJETO C4 FRANQUIAS
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Mudar a forma como você <span className="text-pink-600">vende pela internet</span>
              </h2>

              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
                <p className="text-xl">
                  Hoje, muita gente desiste de empreender por medo de:
                </p>

                <div className="grid md:grid-cols-3 gap-4 my-8">
                  <div className="bg-red-50 border-l-4 border-red-400 p-5 rounded-r-xl">
                    <div className="text-red-600 font-bold mb-2">😰 Investir em estoque</div>
                    <p className="text-sm text-gray-600">Comprar produtos antes de vender</p>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-400 p-5 rounded-r-xl">
                    <div className="text-red-600 font-bold mb-2">📦 Ficar com mercadoria parada</div>
                    <p className="text-sm text-gray-600">Dinheiro investido sem retorno</p>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-400 p-5 rounded-r-xl">
                    <div className="text-red-600 font-bold mb-2">❌ Não conseguir vender</div>
                    <p className="text-sm text-gray-600">Medo de não ter clientes</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white p-8 rounded-2xl my-8">
                  <h3 className="text-2xl font-bold mb-4">O C4 Franquias é um modelo onde você vende com estrutura profissional, usando os nossos produtos, com muito mais segurança.</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6 my-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-pink-600" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Profissionalizar suas vendas</h4>
                    <p className="text-gray-600 text-sm">Site completo e organizado</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-pink-600" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Reduzir riscos</h4>
                    <p className="text-gray-600 text-sm">Sem investimento em estoque</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-pink-600" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Estrutura real de loja online</h4>
                    <p className="text-gray-600 text-sm">Pronta para vender agora</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 📦 MENSAGEM 2 - Como funciona o pedido e a entrega */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-50 to-white">
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
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full text-sm font-bold mb-6">
                💰 PRECISA PAGAR PARA ENTRAR NO PROJETO?
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
                <span className="text-green-600">ZERO</span> taxa de entrada
              </h2>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
                <div className="bg-green-50 border-4 border-green-600 p-8 rounded-2xl">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Sem taxa de entrada</h3>
                  <p className="text-gray-600">Comece agora sem investir nada</p>
                </div>
                <div className="bg-green-50 border-4 border-green-600 p-8 rounded-2xl">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Sem mensalidade</h3>
                  <p className="text-gray-600">Não paga nada todo mês</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white p-10 rounded-3xl mb-8">
                <h3 className="text-3xl font-black mb-4">O Projeto C4 Franquias é GRATUITO para participar</h3>
                <p className="text-xl opacity-90">O único custo acontece quando você vende e faz o pedido dos produtos conosco.</p>
                <p className="text-2xl font-bold mt-4">Nada antes da venda. ✨</p>
              </div>

              <p className="text-xl text-gray-600">
                O objetivo é <strong className="text-pink-600">crescer junto com as franqueadas</strong>, não criar barreiras para começar.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 🏷️ MENSAGEM 4 - Posso escolher meu preço? */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-50 to-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-4 py-2 bg-pink-600 text-white rounded-full text-sm font-bold mb-6">
                🏷️ POSSO ESCOLHER MEU PREÇO?
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Sim. <span className="text-pink-600">Você define sua margem</span>
              </h2>

              <div className="bg-white p-10 rounded-3xl shadow-xl border-2 border-pink-200 mb-8">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Cada franqueada define a margem de lucro que deseja aplicar</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-4xl mb-3">📉</div>
                    <h4 className="font-bold text-lg mb-2">Preço de atacado</h4>
                    <p className="text-gray-600 text-sm">Você tem acesso aos nossos produtos com preço especial</p>
                  </div>
                  <div>
                    <div className="text-4xl mb-3">➕</div>
                    <h4 className="font-bold text-lg mb-2">+ Sua margem</h4>
                    <p className="text-gray-600 text-sm">Adiciona o lucro que fizer sentido para você</p>
                  </div>
                  <div>
                    <div className="text-4xl mb-3">🎯</div>
                    <h4 className="font-bold text-lg mb-2">= Seu preço final</h4>
                    <p className="text-gray-600 text-sm">Vende pelo valor que seu público aceita</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-600 text-white p-8 rounded-2xl text-center">
                <h3 className="text-2xl font-bold mb-2">Liberdade, estratégia e controle. 🚀</h3>
                <p className="text-lg opacity-90">Você escolhe quanto quer ganhar em cada venda</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 🎨 MENSAGEM 5 - Personalização do Site */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold mb-6">
                🎨 PERSONALIZAÇÃO DO SITE
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Um site profissional <span className="text-pink-600">com sua cara</span>
              </h2>

              <p className="text-xl text-gray-700 mb-12 leading-relaxed">
                Cada franqueada recebe um site profissional que pode ser personalizado com:
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border-2 border-pink-200 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mb-6">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Logomarca</h3>
                  <p className="text-gray-600">Coloque sua marca no topo do site</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border-2 border-purple-200 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Paleta de cores</h3>
                  <p className="text-gray-600">Escolha as cores da sua identidade</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-200 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Identidade visual</h3>
                  <p className="text-gray-600">Banners, textos e estilo próprio</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-10 rounded-3xl text-center">
                <h3 className="text-3xl font-black mb-4">Tudo dentro de um padrão pensado para:</h3>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div>
                    <Star className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-bold text-lg">Vender mais</p>
                  </div>
                  <div>
                    <Check className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-bold text-lg">Passar credibilidade</p>
                  </div>
                  <div>
                    <Users className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-bold text-lg">Facilitar a compra</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xl text-gray-600">
                  Chega de vender só por <span className="line-through">fotos soltas no WhatsApp</span> ou <span className="line-through">Instagram</span>. 🚫
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 📝 MENSAGEM 6 - Cadastro no Projeto */}
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

      {/* O que é o C4 Franquias */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-4">O que é</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              C4 Franquias<span className="text-pink-600"> é para você que quer</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Vender rasteirinhas de forma profissional, organizada e sem complicação</p>
          </div>

          {/* Comparativo */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Sem C4 */}
            <div className="bg-gray-100 p-8 rounded-3xl border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-500 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white">✕</span>
                Sem o C4 Franquias
              </h3>
              <ul className="space-y-4 text-gray-500">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Precisa comprar estoque antes de vender</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Manda foto por foto no WhatsApp</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Não tem organização dos pedidos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Parece amadora para as clientes</span>
                </li>
              </ul>
            </div>

            {/* Com C4 */}
            <div className="bg-pink-600 p-8 rounded-3xl text-white shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-pink-600">✓</span>
                Com o C4 Franquias
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                  <span><strong>Sem estoque!</strong> Vende primeiro, compra depois</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                  <span><strong>Site profissional</strong> com todos os produtos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                  <span><strong>Você define</strong> sua margem de lucro</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                  <span><strong>Imagem profissional</strong> para suas clientes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Browser mockup com imagem real */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-lg px-4 py-1.5 text-sm text-gray-400 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>sualoja.c4franquias.com.br</span>
                  </div>
                </div>
              </div>
              {/* Imagem real do site */}
              <div className="relative">
                <Image
                  src="https://i.ibb.co/211c1zhZ/Design-sem-nome-63.png"
                  alt="Exemplo de loja C4 Franquias"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              ✨ Exemplo real de uma loja no C4 Franquias
            </p>
          </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-pink-500/20 text-pink-400 rounded-full text-sm font-semibold mb-4">Passo a passo</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Como funciona?</h2>
            <p className="text-xl text-gray-400">Simples, rápido e sem investimento inicial</p>
          </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Linha conectora */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-pink-600" />

            {[
              { step: '01', title: 'Cadastre-se', description: 'Preencha o formulário gratuito', icon: '✍️' },
              { step: '02', title: 'Receba seu site', description: 'Já com todos os produtos da C4', icon: '🎁' },
              { step: '03', title: 'Personalize', description: 'Cores, logo e margem de lucro', icon: '🎨' },
              { step: '04', title: 'Venda!', description: 'Divulgue e receba pedidos', icon: '💰' }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:border-pink-500/50 transition-all hover:-translate-y-2">
                  <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform mx-auto md:mx-0">
                    <span className="text-2xl font-black">{item.step}</span>
                  </div>
                  <div className="text-4xl mb-4 text-center md:text-left">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-center md:text-left">{item.title}</h3>
                  <p className="text-gray-400 text-center md:text-left">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Destaque do modelo */}
          <div className="mt-16 bg-pink-600/20 rounded-3xl p-8 border border-pink-500/30">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-4">🎯 Entendeu o modelo?</h3>
              <p className="text-gray-300 text-lg">
                Você <strong className="text-white">divulga seu link</strong> → Cliente escolhe no seu site →
                Você <strong className="text-white">faz o pedido conosco</strong> → Nós enviamos para você →
                Você <strong className="text-white">entrega e lucra</strong>!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section id="vantagens" className="py-24 px-4 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-4">Vantagens</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Por que ser<span className="text-pink-600"> Revendedora Pro?</span>
            </h2>
          </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Boxes, title: 'Sem Estoque', description: 'Não precisa investir em produtos. Venda primeiro, compre depois!', color: 'bg-pink-600' },
              { icon: ShoppingBag, title: 'Produtos Prontos', description: 'Site já vem com todo o catálogo da C4 cadastrado.', color: 'bg-purple-600' },
              { icon: TrendingUp, title: 'Você Define o Lucro', description: 'No painel você escolhe sua margem de lucro em cada produto.', color: 'bg-green-600' },
              { icon: Palette, title: 'Totalmente Seu', description: 'Suas cores, sua logo, seu link. Cliente vê SUA marca.', color: 'bg-blue-600' },
              { icon: Headphones, title: 'Suporte Dedicado', description: 'Equipe pronta para te ajudar pelo WhatsApp.', color: 'bg-orange-500' },
              { icon: Users, title: 'Rede de Franquias', description: 'Faça parte da rede oficial Cjota Rasteirinhas.', color: 'bg-rose-600' }
            ].map((item, index) => (
              <div key={index} className="group bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimento */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 mb-8 leading-relaxed">
              &ldquo;Comecei sem estoque e já fiz várias vendas! O site fica lindo e as clientes adoram. Muito melhor que ficar mandando foto por foto.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">A</div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Ana Paula</div>
                <div className="text-gray-500">Revendedora Pro</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎬 Seção de Vídeos FAQ */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-10 md:mb-16">
              <span className="inline-block px-4 py-1.5 bg-pink-500/20 text-pink-400 rounded-full text-sm font-semibold mb-4">Vídeos</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Tire suas dúvidas</h2>
              <p className="text-lg md:text-xl text-gray-400">Assista e entenda como funciona o C4 Franquias</p>
            </div>
          </AnimatedSection>

          {/* Grid de Vídeos - Scroll horizontal no mobile */}
          <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {[
              { title: 'O que é o C4?', url: 'https://files.catbox.moe/rg19bj.MP4' },
              { title: 'Pedido e Entrega', url: 'https://files.catbox.moe/hzg1c3.MP4' },
              { title: 'Precisa Pagar?', url: 'https://files.catbox.moe/ukwqyj.MP4' },
              { title: 'Definir Preços', url: 'https://files.catbox.moe/495y6q.MP4' },
              { title: 'Personalização', url: 'https://files.catbox.moe/k5n0ja.MP4' }
            ].map((video, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 w-[160px] md:w-auto snap-center group"
              >
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 hover:border-pink-500 transition-all duration-300 shadow-lg hover:shadow-pink-500/20">
                  {/* Container do vídeo com aspect ratio de Stories (9:16) */}
                  <div className="relative" style={{ paddingBottom: '177.78%' }}>
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={video.url}
                      playsInline
                      muted
                      loop
                      preload="metadata"
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      onTouchStart={(e) => e.currentTarget.play()}
                      onTouchEnd={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                    {/* Overlay com gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    {/* Ícone de play */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Título do vídeo */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <h3 className="text-white font-bold text-sm md:text-base leading-tight">{video.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicador de scroll no mobile */}
          <div className="flex md:hidden justify-center gap-1.5 mt-4">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-600" />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-4">Tire suas dúvidas</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'Preciso comprar estoque antes de vender?', a: 'Não! Esse é o diferencial do C4 Franquias. Você divulga, vende para sua cliente, e só então faz o pedido conosco.' },
              { q: 'O site já vem com os produtos?', a: 'Sim! Ao se tornar Revendedora Pro, seu site já vem com todo o catálogo da Cjota Rasteirinhas cadastrado.' },
              { q: 'Como eu defino minha margem de lucro?', a: 'No painel da Revendedora Pro você configura o percentual de lucro que quer em cada venda. Simples assim!' },
              { q: 'Posso personalizar o site com minha marca?', a: 'Claro! Você escolhe suas cores, adiciona sua logo e tem seu próprio link para divulgar.' },
              { q: 'Como funciona o envio?', a: 'Você faz o pedido conosco e nós enviamos para você. Aí você entrega para sua cliente e fica com o lucro!' },
              { q: 'Quanto custa para ser Revendedora Pro?', a: 'O cadastro é gratuito! Você não paga nada para ter seu site. Só paga quando fizer pedidos.' }
            ].map((item, index) => (
              <div key={index} className="group bg-gray-50 hover:bg-pink-50 p-6 rounded-2xl transition-colors">
                <h4 className="font-bold text-gray-900 mb-2 flex items-start gap-3">
                  <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">?</span>
                  {item.q}
                </h4>
                <p className="text-gray-600 pl-9">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-pink-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-pink-500/20">
            <Clock className="w-4 h-4" />
            <span>Cadastro gratuito</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Pronta para vender<span className="block text-pink-400">sem precisar de estoque?</span>
          </h2>

          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Junte-se à rede C4 Franquias e comece a vender de forma profissional!</p>

          <Link
            href="/cadastro/revendedora"
            className="group relative inline-flex items-center justify-center gap-3 bg-pink-600 text-white px-10 py-5 rounded-full font-bold text-xl shadow-lg hover:bg-pink-700 hover:-translate-y-1 transition-all"
          >
            <span>Quero ser revendedora</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-gray-400">
            <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" />Sem estoque</span>
            <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" />Site pronto</span>
            <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" />Você define o lucro</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-gray-400 py-16 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
              <Image 
                src="https://i.ibb.co/20Gxkv48/Design-sem-nome-62.png" 
                alt="C4 Franquias" 
                width={48} 
                height={48}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white leading-tight">C4 Franquias</span>
                <span className="text-sm text-pink-400 font-medium -mt-1">by Cjota Rasteirinhas</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">Rede de franquias de calçados femininos. Tenha seu próprio site com nossos produtos, personalize com sua marca e defina sua margem de lucro!</p>
              <div className="flex gap-4">
                <a href="https://instagram.com/cjotarasteirinhas" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-pink-600 transition-colors group">
                  <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://wa.me/5562981480687" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors group">
                  <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Links</h4>
              <ul className="space-y-3">
                <li><Link href="/login" className="hover:text-pink-400 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Área da Revendedora</Link></li>
                <li><Link href="/cadastro/revendedora" className="hover:text-pink-400 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Quero ser Revendedora</Link></li>
                <li><Link href="/termos" className="hover:text-pink-400 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-pink-400 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Política de Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Contato</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Heart className="w-4 h-4 text-pink-500" />contato@cjotarasteirinhas.com.br</li>
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-pink-500" />(62) 98148-0687</li>
                <li className="flex items-center gap-3"><Globe className="w-4 h-4 text-pink-500" />Goiânia - GO</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} C4 Franquias by Cjota Rasteirinhas. Todos os direitos reservados.</p>
            <p className="text-sm flex items-center gap-2">Feito com <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> em Goiânia</p>
          </div>
        </div>
      </footer>
    </div>
  )
}