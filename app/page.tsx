'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  Headphones,
  ArrowRight,
  Instagram,
  Phone,
  Sparkles,
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
                className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 sm:px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all text-sm sm:text-base"
              >
                Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-rose-50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-rose-200/40 to-orange-200/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        {/* Floating elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-400 rounded-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-pink-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg shadow-pink-500/10 border border-pink-100">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Rede de Franquias Cjota Rasteirinhas</span>
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-8">
              Venda rasteirinhas
              <span className="block mt-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
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
                className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 hover:-translate-y-1 transition-all overflow-hidden"
              >
                <span className="relative z-10">Quero ser franqueada</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:-translate-y-1 transition-all shadow-lg"
              >
                Já sou franqueada
              </Link>
            </div>

            {/* 3 Pilares principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Boxes, title: 'Sem Estoque', desc: 'Não precisa comprar antes' },
                { icon: Globe, title: 'Site Pronto', desc: 'Já com nossos produtos' },
                { icon: DollarSign, title: 'Você Define', desc: 'Sua margem de lucro' }
              ].map((item, i) => (
                <div key={i} className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-white hover:shadow-xl hover:-translate-y-1 transition-all">
                  <item.icon className="w-8 h-8 text-pink-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-bold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-pink-400" />
        </div>
      </section>

      {/* O que é o C4 Franquias */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(236,72,153,0.05),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative">
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
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-3xl text-white shadow-xl shadow-pink-500/30">
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

          {/* Browser mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl blur-2xl opacity-20" />
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
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
              <div className="p-8 bg-gradient-to-br from-pink-50 to-white min-h-[350px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">SL</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Sua Loja</h3>
                <p className="text-gray-500 text-sm mb-6">Com suas cores e sua logo</p>
                <div className="grid grid-cols-4 gap-3 max-w-lg">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg" />
                  ))}
                </div>
                <p className="mt-4 text-xs text-gray-400">Produtos já cadastrados pela C4 ↑</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 px-4 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-pink-500/20 text-pink-400 rounded-full text-sm font-semibold mb-4">Passo a passo</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Como funciona?</h2>
            <p className="text-xl text-gray-400">Simples, rápido e sem investimento inicial</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Linha conectora */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />

            {[
              { step: '01', title: 'Cadastre-se', description: 'Preencha o formulário gratuito', icon: '✍️' },
              { step: '02', title: 'Receba seu site', description: 'Já com todos os produtos da C4', icon: '🎁' },
              { step: '03', title: 'Personalize', description: 'Cores, logo e margem de lucro', icon: '🎨' },
              { step: '04', title: 'Venda!', description: 'Divulgue e receba pedidos', icon: '💰' }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-700 hover:border-pink-500/50 transition-all hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform mx-auto md:mx-0">
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
          <div className="mt-16 bg-gradient-to-r from-pink-600/20 to-rose-600/20 rounded-3xl p-8 border border-pink-500/30">
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
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-4">Vantagens</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Por que ser<span className="text-pink-600"> franqueada C4?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Boxes, title: 'Sem Estoque', description: 'Não precisa investir em produtos. Venda primeiro, compre depois!', gradient: 'from-pink-500 to-rose-500' },
              { icon: ShoppingBag, title: 'Produtos Prontos', description: 'Site já vem com todo o catálogo da C4 cadastrado.', gradient: 'from-purple-500 to-pink-500' },
              { icon: TrendingUp, title: 'Você Define o Lucro', description: 'No painel você escolhe sua margem de lucro em cada produto.', gradient: 'from-green-500 to-emerald-500' },
              { icon: Palette, title: 'Totalmente Seu', description: 'Suas cores, sua logo, seu link. Cliente vê SUA marca.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Headphones, title: 'Suporte Dedicado', description: 'Equipe pronta para te ajudar pelo WhatsApp.', gradient: 'from-orange-500 to-amber-500' },
              { icon: Users, title: 'Rede de Franquias', description: 'Faça parte da rede oficial Cjota Rasteirinhas.', gradient: 'from-rose-500 to-red-500' }
            ].map((item, index) => (
              <div key={index} className="group relative bg-white p-8 rounded-3xl border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
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
      <section className="py-24 px-4 bg-gradient-to-br from-pink-50 to-rose-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-200 rounded-full blur-3xl opacity-30" />
        <div className="max-w-4xl mx-auto relative">
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
              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xl">A</div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Ana Paula</div>
                <div className="text-gray-500">Franqueada C4</div>
              </div>
            </div>
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
              { q: 'O site já vem com os produtos?', a: 'Sim! Ao se tornar franqueada, seu site já vem com todo o catálogo da Cjota Rasteirinhas cadastrado.' },
              { q: 'Como eu defino minha margem de lucro?', a: 'No painel da franqueada você configura o percentual de lucro que quer em cada venda. Simples assim!' },
              { q: 'Posso personalizar o site com minha marca?', a: 'Claro! Você escolhe suas cores, adiciona sua logo e tem seu próprio link para divulgar.' },
              { q: 'Como funciona o envio?', a: 'Você faz o pedido conosco e nós enviamos para você. Aí você entrega para sua cliente e fica com o lucro!' },
              { q: 'Quanto custa para ser franqueada?', a: 'O cadastro é gratuito! Você não paga nada para ter seu site. Só paga quando fizer pedidos.' }
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
      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 via-gray-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(236,72,153,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.15),transparent_50%)]" />

        {/* Floating dots */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-pink-500 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-pink-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-pink-500/20">
            <Clock className="w-4 h-4" />
            <span>Cadastro gratuito</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Pronta para vender<span className="block bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">sem precisar de estoque?</span>
          </h2>

          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Junte-se à rede C4 Franquias e comece a vender de forma profissional!</p>

          <Link
            href="/cadastro/revendedora"
            className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 py-5 rounded-full font-bold text-xl shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-1 transition-all"
          >
            <span>Quero ser franqueada</span>
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
                <li><Link href="/login" className="hover:text-pink-400 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Área da Franqueada</Link></li>
                <li><Link href="/cadastro/revendedora" className="hover:text-pink-400 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Quero ser Franqueada</Link></li>
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