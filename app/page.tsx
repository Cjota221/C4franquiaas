'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import {
  ArrowRight,
  Instagram,
  Phone,
  Check,
  ChevronDown,
  Store,
  Palette,
  Package,
  MessageCircle,
  Menu,
  X,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Gift,
  Tag
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

// Componente de Vídeo - usando video nativo com controls
function VideoPlayer({ src, label }: { src: string; label?: string }) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      <div className="relative aspect-[9/16]">
        {!hasError ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            controls
            playsInline
            preload="auto"
            onError={() => setHasError(true)}
            poster=""
          >
            <source src={src} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <p className="text-gray-400 text-sm text-center px-4">Vídeo indisponível</p>
          </div>
        )}
      </div>
      
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
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
          isOpen ? 'max-h-48 pb-5' : 'max-h-0'
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
      answer: 'Não! Você vende primeiro para sua cliente e só depois faz o pedido com a gente. Zero risco de ficar com mercadoria parada. Você só compra o que já vendeu.' 
    },
    { 
      question: 'Quanto custa para ter minha franquia?', 
      answer: 'O cadastro é 100% gratuito. Não tem taxa de entrada nem mensalidade. Você só paga quando fizer pedidos dos produtos que já vendeu.' 
    },
    { 
      question: 'Como funciona o pagamento das minhas clientes?', 
      answer: 'Sua cliente escolhe os produtos no seu site, adiciona ao carrinho e finaliza pelo seu WhatsApp. Você combina a forma de pagamento diretamente com ela e fica com todo o lucro.' 
    },
    { 
      question: 'Posso personalizar o site com minha marca?', 
      answer: 'Sim! Você coloca sua logo, escolhe suas cores, adiciona banners, configura suas redes sociais e define seus próprios preços. O cliente vê sua marca, não a nossa.' 
    },
    { 
      question: 'Qual a margem de lucro?', 
      answer: 'Você define! No painel você configura sua margem sobre cada produto. Compra com preço de atacado e vende pelo preço que quiser. A diferença é seu lucro.' 
    },
    { 
      question: 'Os produtos são de vocês mesmo?', 
      answer: 'Sim! Todos os produtos são da Cjota Rasteirinhas. Fotos profissionais, descrições completas e estoque atualizado em tempo real no seu site.' 
    },
  ]

  return (
    <div className="min-h-screen bg-white antialiased">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
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
            
            <nav className="hidden lg:flex items-center gap-10">
              <a href="#o-que-e" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                O que é
              </a>
              <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Como Funciona
              </a>
              <a href="#ferramentas" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Ferramentas
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Dúvidas
              </a>
            </nav>
            
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition">
                Entrar
              </Link>
              <Link
                href="/cadastro/revendedora"
                className="bg-pink-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors"
              >
                Quero minha Franquia
              </Link>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100">
            <div className="px-5 py-6 space-y-1">
              <a href="#o-que-e" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 font-medium py-3">O que é</a>
              <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 font-medium py-3">Como Funciona</a>
              <a href="#ferramentas" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 font-medium py-3">Ferramentas</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 font-medium py-3">Dúvidas</a>
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center py-3 text-gray-700 font-medium border border-gray-200 rounded-xl">Entrar</Link>
                <Link href="/cadastro/revendedora" onClick={() => setMobileMenuOpen(false)} className="block text-center py-3 bg-pink-600 text-white font-semibold rounded-xl">Quero minha Franquia</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO - A Grande Promessa
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-20">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            <div className="order-2 lg:order-1">
              {/* Badge de pioneirismo */}
              <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Modelo pioneiro no Brasil
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1] mb-6">
                Sua própria loja virtual de calçados
                <span className="text-pink-600"> pronta para vender</span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Chega de mandar foto por foto no WhatsApp. Tenha um <strong>site profissional completo</strong> com todos os nossos produtos, fotos, descrições e estoque atualizado em tempo real.
              </p>
              
              <p className="text-base text-gray-500 mb-8">
                Você personaliza com sua marca, define seus preços e divulga. Sua cliente escolhe, você vende e lucra. <strong>Sem precisar de estoque.</strong>
              </p>
              
              {/* Social Proof */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">+100</div>
                  <div className="text-xs text-gray-500">Franqueadas ativas</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-xs text-gray-500">Gratuito</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-500">Estoque necessário</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/cadastro/revendedora"
                  className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-600/20"
                >
                  Quero minha franquia grátis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Já sou franqueada
                </Link>
              </div>
              
              {/* CTA Demonstração */}
              <div className="mt-6">
                <a
                  href="https://c4franquias.com/catalogo/vivaz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-pink-600 font-medium hover:text-pink-700 transition-colors"
                >
                  <Store className="w-5 h-5" />
                  Ver como fica o site
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            {/* Vídeo Principal */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="w-full max-w-[260px] sm:max-w-[280px]">
                <VideoPlayer 
                  src="https://files.catbox.moe/rg19bj.MP4" 
                  label="Entenda o C4 Franquias"
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          O PROBLEMA - Por que isso existe
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="o-que-e" className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                Cansada de perder vendas por falta de estrutura?
              </h2>
              <p className="text-lg text-gray-600">
                A maioria das revendedoras perde clientes porque não tem um lugar organizado para mostrar os produtos. 
                O cliente chega, não encontra um catálogo, fica esperando fotos... e desiste.
              </p>
            </div>
            
            {/* Comparativo Antes/Depois */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              
              {/* Antes */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-gray-200">
                <div className="text-red-500 font-semibold text-sm mb-4">SEM O C4 FRANQUIAS</div>
                <ul className="space-y-4">
                  {[
                    'Manda foto por foto no WhatsApp',
                    'Cliente pergunta se tem no estoque',
                    'Não sabe qual numeração tem',
                    'Perde venda por demora',
                    'Parece amador e desorganizado',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Depois */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-pink-500 shadow-lg">
                <div className="text-pink-600 font-semibold text-sm mb-4">COM O C4 FRANQUIAS</div>
                <ul className="space-y-4">
                  {[
                    'Seu link profissional para divulgar',
                    'Estoque atualizado em tempo real',
                    'Todas as numerações visíveis',
                    'Cliente escolhe sozinha no site',
                    'Imagem profissional e confiável',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
            
            {/* CTA Ver Demonstração */}
            <div className="text-center mt-10">
              <a
                href="https://c4franquias.com/catalogo/vivaz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-700 transition-colors shadow-lg"
              >
                <Store className="w-5 h-5" />
                Quero ver como fica o site
              </a>
              <p className="text-gray-500 text-sm mt-3">Veja um exemplo real funcionando</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          O QUE VOCÊ RECEBE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                O que você recebe
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Um site completo, pronto para vender
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  icon: Store, 
                  title: 'Site profissional pronto', 
                  desc: 'Todos os nossos produtos já cadastrados com fotos profissionais, descrições e numerações.' 
                },
                { 
                  icon: Clock, 
                  title: 'Estoque em tempo real', 
                  desc: 'Quando uma peça acaba no nosso estoque, automaticamente sai do seu site. Zero risco de vender o que não tem.' 
                },
                { 
                  icon: Palette, 
                  title: 'Personalização completa', 
                  desc: 'Coloque sua logo, escolha suas cores, adicione banners, barra de anúncios e suas redes sociais.' 
                },
                { 
                  icon: Tag, 
                  title: 'Seus preços, seu lucro', 
                  desc: 'Defina sua margem de lucro no painel. A diferença entre atacado e seu preço de venda é seu.' 
                },
                { 
                  icon: MessageCircle, 
                  title: 'Vendas pelo WhatsApp', 
                  desc: 'Cliente escolhe no site e finaliza pelo seu WhatsApp. Você fecha a venda e combina o pagamento.' 
                },
                { 
                  icon: Package, 
                  title: 'Sem estoque', 
                  desc: 'Venda primeiro, compre depois. A gente envia pra você e você entrega pra sua cliente.' 
                },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <item.icon className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            
            {/* CTA Ver Demonstração */}
            <div className="text-center mt-10">
              <a
                href="https://c4franquias.com/catalogo/vivaz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-pink-600 font-medium hover:text-pink-700 transition-colors text-lg"
              >
                <Store className="w-5 h-5" />
                Ver exemplo de site funcionando
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMO FUNCIONA - Passo a passo
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Vídeo */}
              <div className="flex justify-center order-1">
                <div className="w-full max-w-[240px] sm:max-w-[260px]">
                  <VideoPlayer 
                    src="https://files.catbox.moe/hzg1c3.MP4" 
                    label="Como funciona na prática"
                  />
                </div>
              </div>
              
              {/* Passos */}
              <div className="order-2">
                <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                  Simples assim
                </p>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-8">
                  Como funciona o fluxo de vendas
                </h2>
                
                <div className="space-y-6">
                  {[
                    { 
                      num: '1', 
                      title: 'Divulgue seu link', 
                      desc: 'Você recebe um link exclusivo do seu site para divulgar nas redes sociais' 
                    },
                    { 
                      num: '2', 
                      title: 'Cliente escolhe no seu site', 
                      desc: 'Ela vê todas as peças com fotos, preços e numerações. Adiciona ao carrinho e finaliza pelo seu WhatsApp' 
                    },
                    { 
                      num: '3', 
                      title: 'Você fecha a venda', 
                      desc: 'Combina o pagamento direto com sua cliente e recebe' 
                    },
                    { 
                      num: '4', 
                      title: 'Compre da gente o que vendeu', 
                      desc: 'Faça o pedido no painel. A gente envia pra você, você entrega pra sua cliente' 
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold">
                        {step.num}
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
          FERRAMENTAS PODEROSAS
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="ferramentas" className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                Ferramentas poderosas
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
                Muito mais que um catálogo online
              </h2>
              <p className="text-gray-600">
                Seu painel tem ferramentas profissionais para você vender mais
              </p>
            </div>
            
            {/* Grid com vídeos e ferramentas */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-10">
              
              {/* Card Personalização */}
              <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-[180px]">
                    <VideoPlayer 
                      src="https://files.catbox.moe/k5n0ja.MP4"
                      label="Personalização"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
                    <Palette className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Personalização completa</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Logo, cores, banners, barra de anúncios, redes sociais. Seu site com a cara da sua marca.
                  </p>
                </div>
              </div>
              
              {/* Card Preços */}
              <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-[180px]">
                    <VideoPlayer 
                      src="https://files.catbox.moe/495y6q.MP4"
                      label="Defina seus preços"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Você define os preços</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Configure sua margem de lucro. Quanto maior sua margem, maior seu ganho em cada venda.
                  </p>
                </div>
              </div>
              
            </div>
            
            {/* Lista de ferramentas extras */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: ShoppingCart, title: 'Carrinho abandonado', desc: 'Veja quem entrou e não comprou' },
                { icon: Gift, title: 'Cupons de desconto', desc: 'Crie promoções para suas clientes' },
                { icon: Zap, title: 'Frete grátis', desc: 'Configure promoções de frete' },
                { icon: Tag, title: 'Leve + Pague -', desc: 'Promoções para vender mais' },
              ].map((tool, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <tool.icon className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{tool.title}</h4>
                  <p className="text-gray-500 text-xs">{tool.desc}</p>
                </div>
              ))}
            </div>
            
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INVESTIMENTO ZERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Texto */}
              <div>
                <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                  Risco zero
                </p>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  Você não paga nada para começar
                </h2>
                
                <div className="space-y-4 mb-8">
                  {[
                    'Cadastro 100% gratuito',
                    'Sem taxa de entrada',
                    'Sem mensalidade',
                    'Sem precisar de estoque',
                    'Você só paga quando fizer pedidos',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <p className="text-pink-800 text-sm">
                    <strong>Modelo único:</strong> Nenhuma fábrica ou fornecedor oferece isso. 
                    Somos pioneiros em franquias digitais de calçados no Brasil.
                  </p>
                </div>
              </div>
              
              {/* Vídeo */}
              <div className="flex justify-center">
                <div className="w-full max-w-[240px] sm:max-w-[260px]">
                  <VideoPlayer 
                    src="https://files.catbox.moe/ukwqyj.MP4"
                    label="Precisa investir?"
                  />
                </div>
              </div>
              
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-10">
              <p className="text-pink-600 font-semibold text-sm tracking-wide uppercase mb-4">
                Dúvidas frequentes
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Tire suas dúvidas
              </h2>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
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
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              +100 franqueadas já estão vendendo
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
              Pronta para vender de forma profissional?
            </h2>
            
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Tenha sua franquia digital hoje mesmo. 
              Cadastro gratuito, sem estoque, sem mensalidade.
            </p>
            
            <Link
              href="/cadastro/revendedora"
              className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-pink-500 transition-colors"
            >
              Quero minha franquia grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                100% gratuito
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Aprovação em 24h
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Suporte no WhatsApp
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10">
            
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
                A primeira rede de franquias digitais de calçados femininos do Brasil. 
                Tenha seu site profissional e venda os nossos produtos com a sua marca.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://instagram.com/cjotarasteirinhas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-gray-400" />
                </a>
                <a 
                  href="https://wa.me/5562981480687" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Phone className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Links</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Área da Franqueada</Link></li>
                <li><Link href="/cadastro/revendedora" className="text-gray-400 hover:text-white transition-colors">Quero ser Franqueada</Link></li>
                <li><Link href="/termos" className="text-gray-400 hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-400 hover:text-white transition-colors">Privacidade</Link></li>
              </ul>
            </div>
            
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} C4 Franquias by Cjota Rasteirinhas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
      
      {/* Botão WhatsApp Flutuante */}
      <a
        href="https://wa.me/5562981480687?text=Olá! Vim pelo site e quero saber mais sobre a franquia C4."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all"
        aria-label="Falar no WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      
    </div>
  )
}
