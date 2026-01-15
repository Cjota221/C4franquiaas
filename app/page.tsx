'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import {
  ArrowRight,
  Instagram,
  Phone,
  Check,
  Play,
  ChevronDown,
  Store,
  Wallet,
  Palette,
  Package,
  MessageCircle,
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

// Componente de seção animada
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

// Componente de Vídeo com player customizado
function VideoPlayer({ src, label }: { src: string; label?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      <div className="relative aspect-[9/16]">
        {!hasError ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            preload="auto"
            onLoadedData={() => setIsLoaded(true)}
            onEnded={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
            controls={isPlaying}
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <p className="text-gray-400 text-sm text-center px-4">Vídeo indisponível</p>
          </div>
        )}
        
        {/* Play Button Overlay */}
        {!isPlaying && !hasError && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors group cursor-pointer"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-pink-600 ml-1" fill="currentColor" />
            </div>
          </button>
        )}
        
        {/* Loading State */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Label */}
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm font-medium text-center">{label}</p>
        </div>
      )}
    </div>
  )
}

// Componente FAQ Accordion
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-semibold text-gray-900 pr-4 group-hover:text-pink-600 transition-colors">
          {question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-pink-600' : ''
          }`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-40 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const faqs = [
    { 
      question: 'Preciso investir em estoque?', 
      answer: 'Não. Você vende primeiro e só depois faz o pedido conosco. Zero risco de ficar com mercadoria parada.' 
    },
    { 
      question: 'Quanto custa para participar?', 
      answer: 'O cadastro é 100% gratuito. Não há taxa de entrada nem mensalidade. Você só paga quando fizer pedidos.' 
    },
    { 
      question: 'Posso personalizar meu site?', 
      answer: 'Sim. Você escolhe suas cores, adiciona sua logo e define seus preços. O cliente vê sua marca, não a nossa.' 
    },
    { 
      question: 'Como funciona a entrega?', 
      answer: 'Você faz o pedido conosco, nós enviamos para você, e você entrega ao cliente final ficando com o lucro.' 
    },
    { 
      question: 'Qual a margem de lucro?', 
      answer: 'Você define sua própria margem no painel. Compra com preço de atacado e vende pelo preço que preferir.' 
    },
  ]

  return (
    <div className="min-h-screen bg-white antialiased">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Fixo, minimalista, profissional
      ═══════════════════════════════════════════════════════════════════ */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <Image 
                src="https://i.ibb.co/20Gxkv48/Design-sem-nome-62.png" 
                alt="C4 Franquias" 
                width={36} 
                height={36}
                className="rounded-full"
                priority
              />
              <div>
                <div className="text-lg font-bold text-gray-900 leading-none">C4 Franquias</div>
                <div className="text-[10px] text-gray-500 font-medium">by Cjota Rasteirinhas</div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Como Funciona
              </a>
              <a href="#vantagens" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Vantagens
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Dúvidas
              </a>
            </nav>
            
            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition">
                Entrar
              </Link>
              <Link
                href="/cadastro/revendedora"
                className="bg-pink-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100">
            <div className="px-5 py-6 space-y-1">
              <a 
                href="#como-funciona" 
                onClick={() => setMobileMenuOpen(false)} 
                className="block text-gray-700 font-medium py-3 hover:text-pink-600 transition"
              >
                Como Funciona
              </a>
              <a 
                href="#vantagens" 
                onClick={() => setMobileMenuOpen(false)} 
                className="block text-gray-700 font-medium py-3 hover:text-pink-600 transition"
              >
                Vantagens
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)} 
                className="block text-gray-700 font-medium py-3 hover:text-pink-600 transition"
              >
                Dúvidas
              </a>
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block text-center py-3 text-gray-700 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Entrar
                </Link>
                <Link 
                  href="/cadastro/revendedora" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block text-center py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition"
                >
                  Começar Grátis
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          DOBRA 1: HERO SECTION - A Promessa Principal
          Vídeo 1 em destaque total
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-24">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Texto */}
            <div className="order-2 lg:order-1">
              <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                Rede de Franquias Cjota Rasteirinhas
              </p>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1] mb-6">
                Venda calçados com
                <span className="text-pink-600"> estrutura profissional</span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                Tenha seu próprio site de vendas, sem precisar de estoque. 
                Você vende, nós entregamos. Simples assim.
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-10">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span>Cadastro 100% gratuito</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span>Sem estoque necessário</span>
                </div>
              </div>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/cadastro/revendedora"
                  className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-600/20"
                >
                  Quero ser franqueada
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Já tenho cadastro
                </Link>
              </div>
            </div>
            
            {/* Vídeo 1 - Principal */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="w-full max-w-[260px] sm:max-w-[280px] lg:max-w-[300px]">
                <VideoPlayer 
                  src="https://files.catbox.moe/rg19bj.MP4" 
                  label="O que é o C4 Franquias"
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DOBRA 2: O PROBLEMA E A SOLUÇÃO
          Vídeo 2 - Layout Z-Pattern (invertido)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Vídeo 2 */}
              <div className="flex justify-center order-1">
                <div className="w-full max-w-[240px] sm:max-w-[260px]">
                  <VideoPlayer 
                    src="https://files.catbox.moe/hzg1c3.MP4" 
                    label="Pedido e Entrega"
                  />
                </div>
              </div>
              
              {/* Texto */}
              <div className="order-2">
                <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                  Entenda o modelo
                </p>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-8">
                  O fluxo de vendas mais simples que existe
                </h2>
                
                <div className="space-y-6">
                  {[
                    { icon: Store, title: 'Cliente acessa seu site', desc: 'Personalizado com sua marca e seus preços' },
                    { icon: MessageCircle, title: 'Pedido vai pro seu WhatsApp', desc: 'Você recebe e fecha a venda diretamente' },
                    { icon: Package, title: 'Faça o pedido conosco', desc: 'Comprando apenas o que já vendeu' },
                    { icon: Check, title: 'Entregue e lucre', desc: 'A diferença entre atacado e varejo é seu lucro' },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                        <step.icon className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DOBRA 3: DEEP DIVE - Funcionalidades e Diferenciais
          Vídeos 3 e 4 lado a lado em cards
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="vantagens" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            
            {/* Header da seção */}
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                Entenda os detalhes
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Tudo que você precisa saber antes de começar
              </h2>
            </div>
            
            {/* Grid de Vídeos 3 e 4 */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              
              {/* Card Vídeo 3 - Investimento */}
              <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-[180px] sm:max-w-[200px]">
                    <VideoPlayer 
                      src="https://files.catbox.moe/ukwqyj.MP4"
                      label="Investimento Zero"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Investimento Zero</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Sem taxa de entrada, sem mensalidade. Você só paga quando faz pedidos após vender.
                  </p>
                </div>
              </div>
              
              {/* Card Vídeo 4 - Preços */}
              <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-[180px] sm:max-w-[200px]">
                    <VideoPlayer 
                      src="https://files.catbox.moe/495y6q.MP4"
                      label="Defina seus Preços"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
                    <Palette className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Você Define os Preços</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Configure sua margem de lucro no painel. Sua estratégia de preços, seu controle total.
                  </p>
                </div>
              </div>
              
            </div>
            
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SEÇÃO: VANTAGENS RÁPIDAS (Lista visual minimalista)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {[
                { 
                  icon: Package, 
                  title: 'Sem Estoque', 
                  desc: 'Venda primeiro, compre depois. Zero risco de mercadoria parada.' 
                },
                { 
                  icon: Store, 
                  title: 'Site Profissional', 
                  desc: 'Catálogo completo já cadastrado e pronto para você divulgar.' 
                },
                { 
                  icon: Palette, 
                  title: 'Sua Marca', 
                  desc: 'Personalize cores, logo e preços. O cliente vê sua identidade.' 
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-5 shadow-sm border border-gray-100">
                    <item.icon className="w-7 h-7 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DOBRA 4: FAQ VISUAL - Matando Objeções
          Vídeo 5 + Accordion FAQ lado a lado
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              
              {/* Coluna do Vídeo 5 */}
              <div>
                <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                  Tire suas dúvidas
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-8">
                  Ainda tem dúvidas? Este vídeo responde tudo.
                </h2>
                
                <div className="flex justify-center lg:justify-start">
                  <div className="w-full max-w-[240px] sm:max-w-[260px]">
                    <VideoPlayer 
                      src="https://files.catbox.moe/k5n0ja.MP4"
                      label="Personalização do Site"
                    />
                  </div>
                </div>
              </div>
              
              {/* Coluna do FAQ Accordion */}
              <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Perguntas Frequentes</h3>
                <p className="text-gray-600 text-sm mb-6">Clique para expandir</p>
                <div>
                  {faqs.map((faq, i) => (
                    <FAQItem
                      key={i}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openFAQ === i}
                      onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                    />
                  ))}
                </div>
              </div>
              
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL - Última chamada para ação
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-gray-900">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
              Pronta para começar a vender de forma profissional?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Cadastro gratuito, sem estoque, sem mensalidade. 
              Comece hoje mesmo.
            </p>
            
            <Link
              href="/cadastro/revendedora"
              className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-pink-500 transition-colors"
            >
              Criar minha franquia grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                100% gratuito
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Sem compromisso
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Análise em 24h
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER - Minimalista e profissional
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            
            {/* Logo e descrição */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Image 
                  src="https://i.ibb.co/20Gxkv48/Design-sem-nome-62.png" 
                  alt="C4 Franquias" 
                  width={32} 
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <div className="text-white font-bold leading-none">C4 Franquias</div>
                  <div className="text-[10px] text-gray-500">by Cjota Rasteirinhas</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
                Rede de franquias de calçados femininos. Tenha seu próprio site, personalize com sua marca e venda sem precisar de estoque.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://instagram.com/cjotarasteirinhas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-gray-400" />
                </a>
                <a 
                  href="https://wa.me/5562981480687" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  aria-label="WhatsApp"
                >
                  <Phone className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Links</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                    Área da Franqueada
                  </Link>
                </li>
                <li>
                  <Link href="/cadastro/revendedora" className="text-gray-400 hover:text-white transition-colors">
                    Quero ser Franqueada
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="text-gray-400 hover:text-white transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-gray-400 hover:text-white transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
            
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} C4 Franquias by Cjota Rasteirinhas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
      
    </div>
  )
}
