'use client';

import Link from 'next/link'
import Image from 'next/image'
import { Users, Store, ArrowRight } from 'lucide-react'

export default function LoginChoicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      {/* Header simples */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image 
            src="/android-chrome-192x192.png" 
            alt="C4 Franquias" 
            width={40} 
            height={40}
            className="rounded-full"
          />
          <span className="text-xl font-bold text-pink-600">C4 Franquias</span>
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bem-vinda de volta! 👋
            </h1>
            <p className="text-xl text-gray-600">
              Selecione como deseja acessar o sistema
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Card Revendedora */}
            <Link 
              href="/login/revendedora"
              className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-pink-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-200 transition">
                <Users className="w-8 h-8 text-pink-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Sou Revendedora
              </h2>
              <p className="text-gray-600 mb-6">
                Acesse seu painel para gerenciar produtos, pedidos e sua loja virtual
              </p>
              <span className="inline-flex items-center gap-2 text-pink-600 font-semibold group-hover:gap-3 transition-all">
                Fazer login
                <ArrowRight className="w-5 h-5" />
              </span>
            </Link>

            {/* Card Franqueada */}
            <Link 
              href="/login/franqueada"
              className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition">
                <Store className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Sou Franqueada
              </h2>
              <p className="text-gray-600 mb-6">
                Acesse seu painel para gerenciar suas revendedoras e produtos
              </p>
              <span className="inline-flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                Fazer login
                <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
          </div>

          {/* Link para cadastro */}
          <div className="text-center mt-12">
            <p className="text-gray-600">
              Ainda não tem conta?{' '}
              <Link href="/cadastro/revendedora" className="text-pink-600 font-semibold hover:underline">
                Cadastre-se como revendedora
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        © 2024 C4 Franquias. Todos os direitos reservados.
      </footer>
    </div>
  )
}
