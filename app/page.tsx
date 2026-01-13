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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#FAFAFA]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white text-pink-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm border border-gray-100">
              <span>Rede de Franquias Cjota Rasteirinhas</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-8">
              Venda rasteirinhas
              <span className="block mt-2 text-pink-600">
                sem precisar de estoque
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
              Receba um <strong className="text-gray-900">site profissional pronto</strong> com nossos produtos.
              Personalize com sua marca e <strong className="text-gray-900">defina sua margem de lucro</strong>!
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/cadastro/revendedora"
                className="group relative inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-pink-700 hover:-translate-y-1 transition-all"
              >
                <span>Quero ser revendedora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full font-bold text-lg border border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:-translate-y-1 transition-all shadow-sm"
              >
                Já sou revendedora
              </Link>
            </div>

            {/* 3 Pilares principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Boxes, title: 'Sem Estoque', desc: 'Não precisa comprar antes' },
                { icon: Globe, title: 'Site Pronto', desc: 'Já com nossos produtos' },
                { icon: DollarSign, title: 'Você Define', desc: 'Sua margem de lucro' }
              ].map((item, i) => (
                <div key={i} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all">
                  <item.icon className="w-8 h-8 text-pink-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-bold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-400" />
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