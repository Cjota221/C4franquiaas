'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Shield, 
  Smartphone,
  Star,
  ArrowRight,
  Instagram,
  Mail
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Image 
                src="/android-chrome-192x192.png" 
                alt="C4 Franquias" 
                width={40} 
                height={40}
                className="rounded-full"
              />
              <span className="text-xl font-bold text-pink-600">C4 Franquias</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#sobre" className="text-gray-600 hover:text-pink-600 transition">Sobre</a>
              <a href="#beneficios" className="text-gray-600 hover:text-pink-600 transition">Benefícios</a>
              <a href="#depoimentos" className="text-gray-600 hover:text-pink-600 transition">Depoimentos</a>
              <a href="#contato" className="text-gray-600 hover:text-pink-600 transition">Contato</a>
            </nav>
            <Link 
              href="/login" 
              className="bg-pink-600 text-white px-6 py-2 rounded-full font-medium hover:bg-pink-700 transition"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transforme sua paixão em um 
                <span className="text-pink-600"> negócio lucrativo</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Seja uma revendedora C4 e tenha acesso a produtos exclusivos, 
                preços especiais e todo suporte para crescer no mercado de moda.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/cadastro/revendedora"
                  className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-700 transition shadow-lg shadow-pink-600/30"
                >
                  Quero ser revendedora
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg border-2 border-pink-600 hover:bg-pink-50 transition"
                >
                  Já sou cadastrada
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 border-2 border-white" />
                  ))}
                </div>
                <p className="text-gray-600">
                  <span className="font-bold text-gray-900">+500</span> revendedoras ativas
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="w-32 h-32 text-pink-600/30" />
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lucro médio</p>
                    <p className="text-xl font-bold text-gray-900">40-60%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Por que ser uma revendedora C4?
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Oferecemos tudo que você precisa para ter sucesso nas vendas
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ShoppingBag, title: 'Catálogo Exclusivo', description: 'Acesso a produtos de qualidade com preços especiais para revenda' },
              { icon: Smartphone, title: 'Loja Virtual Própria', description: 'Sua loja online personalizada para compartilhar com clientes' },
              { icon: TrendingUp, title: 'Alta Margem de Lucro', description: 'Ganhe de 40% a 60% de lucro em cada venda realizada' },
              { icon: Users, title: 'Suporte Completo', description: 'Equipe dedicada para te ajudar em todas as etapas' },
              { icon: Shield, title: 'Sem Mensalidade', description: 'Cadastro gratuito, você só paga pelos produtos que comprar' },
              { icon: Star, title: 'Treinamentos', description: 'Materiais e dicas exclusivas para alavancar suas vendas' }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl hover:border-pink-100 transition-all duration-300">
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="sobre" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Como funciona?</h2>
            <p className="mt-4 text-xl text-gray-600">Em apenas 3 passos você começa a vender</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Faça seu cadastro', description: 'Preencha o formulário com seus dados e aguarde a aprovação' },
              { step: '2', title: 'Acesse seu catálogo', description: 'Receba acesso à sua loja virtual com todos os produtos' },
              { step: '3', title: 'Comece a vender', description: 'Compartilhe sua loja e ganhe dinheiro com cada venda' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-pink-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">O que nossas revendedoras dizem</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Maria Silva', role: 'Revendedora há 2 anos', text: 'Consegui uma renda extra incrível! Os produtos são de qualidade e os clientes adoram.' },
              { name: 'Ana Santos', role: 'Revendedora há 1 ano', text: 'O suporte é maravilhoso, sempre me ajudam quando preciso. Super recomendo!' },
              { name: 'Julia Oliveira', role: 'Revendedora há 6 meses', text: 'Comecei como hobby e hoje é minha principal fonte de renda. Mudou minha vida!' }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">&ldquo;{item.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronta para começar sua jornada?</h2>
          <p className="text-xl text-pink-100 mb-8">Junte-se a centenas de mulheres que já transformaram suas vidas com a C4</p>
          <Link 
            href="/cadastro/revendedora"
            className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-50 transition shadow-xl"
          >
            Cadastre-se agora gratuitamente
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/android-chrome-192x192.png" alt="C4 Franquias" width={40} height={40} className="rounded-full" />
                <span className="text-xl font-bold text-white">C4 Franquias</span>
              </div>
              <p className="text-gray-400 mb-4">Transformando sonhos em negócios de sucesso desde 2020.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-pink-400 transition">Área da Revendedora</Link></li>
                <li><Link href="/cadastro/revendedora" className="hover:text-pink-400 transition">Quero ser Revendedora</Link></li>
                <li><Link href="/termos" className="hover:text-pink-400 transition">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-pink-400 transition">Política de Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <ul className="space-y-2">
                <li>contato@c4franquias.com.br</li>
                <li>(62) 98148-0687</li>
                <li>Goiânia - GO</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} C4 Franquias. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

