'use client'

import Link from 'next/link'
import { 
  Package, 
  Store, 
  Truck, 
  CreditCard, 
  Headphones,
  CheckCircle,
  ArrowRight,
  Instagram,
  Phone,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C4</span>
              </div>
              <span className="text-xl font-bold text-gray-900">C4 Franquias</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-pink-600 transition">Como Funciona</a>
              <a href="#vantagens" className="text-gray-600 hover:text-pink-600 transition">Vantagens</a>
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Novo modelo de revenda
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Venda moda feminina
              <span className="text-pink-600"> sem precisar de estoque</span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Você recebe uma <strong>loja virtual completa e profissional</strong> com nossos produtos. 
              Compartilhe com suas clientes, faça a venda e <strong>nós cuidamos de todo o resto</strong> — 
              estoque, embalagem e envio.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/cadastro/revendedora"
                className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-700 transition shadow-lg shadow-pink-600/30"
              >
                Quero ter minha loja
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg border-2 border-pink-600 hover:bg-pink-50 transition"
              >
                Já sou revendedora
              </Link>
            </div>

            {/* Diferenciais rápidos */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Package, text: 'Sem estoque' },
                { icon: Store, text: 'Loja pronta' },
                { icon: Truck, text: 'Nós enviamos' },
                { icon: CreditCard, text: 'Cadastro grátis' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl shadow-sm">
                  <item.icon className="w-5 h-5 text-pink-600" />
                  <span className="text-gray-700 font-medium text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Como funciona?</h2>
            <p className="mt-4 text-xl text-gray-600">Um modelo simples e moderno de revenda</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                step: '1', 
                title: 'Faça seu cadastro', 
                description: 'Preencha seus dados e aguarde a aprovação. É rápido e gratuito!',
                icon: CheckCircle
              },
              { 
                step: '2', 
                title: 'Receba sua loja', 
                description: 'Você ganha uma loja virtual profissional com todos os nossos produtos.',
                icon: Store
              },
              { 
                step: '3', 
                title: 'Divulgue e venda', 
                description: 'Compartilhe o link da sua loja no WhatsApp, Instagram e redes sociais.',
                icon: Phone
              },
              { 
                step: '4', 
                title: 'Nós entregamos', 
                description: 'Sua cliente compra, nós embalamos e enviamos. Você só acompanha!',
                icon: Truck
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                  <div className="w-12 h-12 bg-pink-600 text-white text-xl font-bold rounded-full flex items-center justify-center mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-pink-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Destaque do modelo */}
          <div className="mt-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                É como um Dropshipping, só que melhor!
              </h3>
              <p className="text-pink-100 text-lg">
                Você não precisa comprar produtos antecipadamente, não precisa ter estoque em casa, 
                não precisa embalar e nem ir aos Correios. <strong className="text-white">Nós fazemos tudo isso por você.</strong> 
                Seu trabalho é divulgar sua loja e conquistar clientes!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section id="vantagens" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Por que escolher a C4?
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Vantagens exclusivas para nossas revendedoras
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Store, 
                title: 'Loja Virtual Profissional', 
                description: 'Você recebe uma loja completa, bonita e pronta para vender. Sem precisar entender de tecnologia.' 
              },
              { 
                icon: Package, 
                title: 'Zero Estoque', 
                description: 'Não precisa comprar produtos antes. O estoque é nosso e você vende o que quiser do catálogo.' 
              },
              { 
                icon: Truck, 
                title: 'Nós Enviamos', 
                description: 'Quando sua cliente compra, nós embalamos com carinho e enviamos direto para ela.' 
              },
              { 
                icon: CreditCard, 
                title: 'Cadastro 100% Gratuito', 
                description: 'Não tem taxa de adesão, mensalidade ou qualquer custo escondido. Você só ganha!' 
              },
              { 
                icon: Headphones, 
                title: 'Suporte Dedicado', 
                description: 'Equipe pronta para te ajudar pelo WhatsApp sempre que precisar.' 
              },
              { 
                icon: ShieldCheck, 
                title: 'Produtos de Qualidade', 
                description: 'Trabalhamos apenas com produtos selecionados que suas clientes vão amar.' 
              }
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

      {/* FAQ Simples */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Dúvidas Frequentes</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { 
                q: 'Preciso pagar algo para começar?', 
                a: 'Não! O cadastro é 100% gratuito. Não cobramos taxa de adesão nem mensalidade.' 
              },
              { 
                q: 'Preciso ter estoque em casa?', 
                a: 'Não! Todo o estoque fica conosco. Você só divulga sua loja e nós cuidamos do resto.' 
              },
              { 
                q: 'Quem envia o produto para a cliente?', 
                a: 'Nós enviamos! Quando sua cliente faz o pedido, nossa equipe embala e envia direto para ela.' 
              },
              { 
                q: 'Como eu ganho dinheiro?', 
                a: 'Você define o preço de venda na sua loja. A diferença entre seu preço e o nosso preço de custo é seu lucro!' 
              },
              { 
                q: 'Quanto tempo leva para aprovar meu cadastro?', 
                a: 'Normalmente aprovamos em até 24 horas úteis. Você receberá um e-mail assim que for aprovada.' 
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Comece ainda hoje
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronta para ter sua própria loja virtual?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Cadastre-se agora e receba sua loja profissional para começar a vender!
          </p>
          <Link 
            href="/cadastro/revendedora"
            className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-50 transition shadow-xl"
          >
            Quero me cadastrar gratuitamente
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
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">C4</span>
                </div>
                <span className="text-xl font-bold text-white">C4 Franquias</span>
              </div>
              <p className="text-gray-400 mb-4">
                Oferecemos uma plataforma moderna de revenda onde você vende moda feminina 
                sem precisar de estoque. Nós cuidamos de tudo para você!
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://wa.me/5562981480687" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Links</h4>
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

