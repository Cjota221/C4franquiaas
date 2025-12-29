"use client";
import Link from 'next/link';
import { Shield, FileText, Instagram, Phone, Mail, MapPin, BadgeCheck } from 'lucide-react';

interface FooterLojaProps {
  nomeRevendedora?: string;
  cidadeRevendedora?: string;
  instagramRevendedora?: string;
  telefoneRevendedora?: string;
  corPrimaria?: string;
}

export default function FooterLoja({ 
  nomeRevendedora,
  cidadeRevendedora,
  instagramRevendedora,
  telefoneRevendedora,
  corPrimaria = '#9333ea'
}: FooterLojaProps) {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      {/* Seção Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Coluna 1: Sobre a Loja */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" style={{ color: corPrimaria }} />
              Revendedor(a) Autorizado(a)
            </h3>
            {nomeRevendedora && (
              <p className="text-sm mb-2">
                <strong className="text-white">{nomeRevendedora}</strong>
              </p>
            )}
            {cidadeRevendedora && (
              <p className="text-sm flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                {cidadeRevendedora}
              </p>
            )}
            {telefoneRevendedora && (
              <p className="text-sm flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                {telefoneRevendedora}
              </p>
            )}
            {instagramRevendedora && (
              <a 
                href={`https://instagram.com/${instagramRevendedora}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-2 hover:text-white transition"
              >
                <Instagram className="w-4 h-4" />
                @{instagramRevendedora}
              </a>
            )}
          </div>

          {/* Coluna 2: Links Úteis */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Úteis</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="hover:text-white transition flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white transition flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento */}
          <div>
            <h3 className="text-white font-semibold mb-4">Atendimento</h3>
            <p className="text-sm mb-3">
              Para dúvidas sobre produtos e pedidos, entre em contato diretamente com o(a) revendedor(a).
            </p>
            {telefoneRevendedora && (
              <a 
                href={`https://wa.me/55${telefoneRevendedora.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer / Barra Inferior */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            
            {/* Copyright */}
            <p>© {anoAtual} - Todos os direitos reservados</p>
            
            {/* Disclaimer Principal */}
            <div className="text-center md:text-right max-w-xl">
              <p className="flex items-center justify-center md:justify-end gap-1">
                <BadgeCheck className="w-3 h-3" style={{ color: corPrimaria }} />
                <span>
                  Esta loja é operada por um(a) <strong>Revendedor(a) Independente Autorizado(a)</strong>.
                </span>
              </p>
              <p className="mt-1 text-gray-600">
                O(A) revendedor(a) é integralmente responsável por suas vendas, atendimento e entregas.
                A marca não se responsabiliza por transações realizadas nesta loja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
