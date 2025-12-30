'use client'

import Link from 'next/link'
import { 
  CreditCard, 
  Headphones,
  ArrowRight,
  Instagram,
  Phone,
  Sparkles,
  Clock,
  MessageCircle,
  Percent,
  Layout
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
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight">C4 by Cjota</span>
                <span className="text-xs text-pink-600 font-medium -mt-1">Rasteirinhas</span>
              </div>
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
              Atacado de rasteirinhas femininas
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Seu próprio site de vendas
              <span className="text-pink-600"> totalmente personalizado</span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Tenha um <strong>site profissional</strong> com a <strong>sua identidade visual</strong> — 
              suas cores, seu estilo, sua marca. Mostre nossos produtos para suas clientes 
              e venda de forma moderna pelo WhatsApp.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/cadastro/revendedora"
                className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-700 transition shadow-lg shadow-pink-600/30"
              >
                Quero meu site
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
                { icon: Layout, text: 'Site completo' },
                { icon: Sparkles, text: 'Personalizável' },
                { icon: MessageCircle, text: 'WhatsApp integrado' },
                { icon: CreditCard, text: 'Cadastro gratuito' }
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
            <p className="mt-4 text-xl text-gray-600">Simples, rápido e profissional</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                step: '1', 
                title: 'Faça seu cadastro', 
                description: 'Preencha seus dados e aguarde aprovação. É rápido e gratuito!'
              },
              { 
                step: '2', 
                title: 'Personalize seu site', 
                description: 'Escolha suas cores, adicione sua logo e deixe o site com a sua cara!'
              },
              { 
                step: '3', 
                title: 'Divulgue para clientes', 
                description: 'Compartilhe o link do seu site no WhatsApp, Instagram e redes sociais.'
              },
              { 
                step: '4', 
                title: 'Venda pelo WhatsApp', 
                description: 'Sua cliente escolhe no site e finaliza a compra direto com você!'
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
                Um site de verdade, com a sua identidade!
              </h3>
              <p className="text-pink-100 text-lg">
                Não é só um catálogo de fotos. É um <strong className="text-white">site completo</strong> que você personaliza 
                com suas cores, sua logo e seu estilo. Suas clientes vão ver um site profissional 
                com a <strong className="text-white">sua marca</strong>, não a nossa!
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
              O que você recebe
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para vender de forma profissional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Layout, 
                title: 'Site Completo', 
                description: 'Um site de verdade, não só um catálogo. Com páginas, navegação e tudo que um site profissional tem.' 
              },
              { 
                icon: Sparkles, 
                title: 'Totalmente Personalizável', 
                description: 'Escolha suas cores, adicione sua logo, defina seu estilo. O site fica com a SUA identidade visual!' 
              },
              { 
                icon: MessageCircle, 
                title: 'WhatsApp Integrado', 
                description: 'Botão de WhatsApp em todo o site. A cliente vê o produto e já fala direto com você!' 
              },
              { 
                icon: CreditCard, 
                title: 'Cadastro Gratuito', 
                description: 'Você não paga nada para ter seu site. O cadastro é totalmente gratuito!' 
              },
              { 
                icon: Headphones, 
                title: 'Suporte Dedicado', 
                description: 'Equipe pronta para te ajudar pelo WhatsApp sempre que precisar.' 
              },
              { 
                icon: Percent, 
                title: 'Preços de Atacado', 
                description: 'Acesso a preços especiais de atacado para você lucrar em cada venda.' 
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
                q: 'Preciso pagar algo para ter meu site?', 
                a: 'Não! O cadastro é gratuito. Você não paga nada para ter seu site personalizado.' 
              },
              { 
                q: 'Posso personalizar o site com minhas cores?', 
                a: 'Sim! Você escolhe a paleta de cores, adiciona sua logo e deixa o site com a sua identidade visual.' 
              },
              { 
                q: 'Como funciona a venda?', 
                a: 'Sua cliente acessa seu site, escolhe os produtos e entra em contato com você pelo WhatsApp para finalizar a compra.' 
              },
              { 
                q: 'Como eu recebo os produtos?', 
                a: 'Você faz o pedido conosco pelo site e enviamos para você. Aí você entrega para sua cliente.' 
              },
              { 
                q: 'Quanto tempo leva para aprovar meu cadastro?', 
                a: 'Normalmente aprovamos em até 24 horas úteis. Você receberá uma notificação assim que for aprovada.' 
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
            Pronta para ter seu próprio site?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Cadastre-se agora e receba seu site personalizado para vender de forma profissional!
          </p>
          <Link 
            href="/cadastro/revendedora"
            className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-50 transition shadow-xl"
          >
            Quero meu site gratuito
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
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-tight">C4 by Cjota</span>
                  <span className="text-xs text-pink-400 font-medium -mt-1">Rasteirinhas</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Atacado de calçados femininos especializado em rasteirinhas. 
                Oferecemos um catálogo digital profissional para impulsionar suas vendas!
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/cjotarasteirinhas" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
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
                <li>contato@cjotarasteirinhas.com.br</li>
                <li>(62) 98148-0687</li>
                <li>Goiânia - GO</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} C4 by Cjota Rasteirinhas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

