"use client";
import React from 'react';
import Link from 'next/link';
import { useLojaInfo } from '@/contexts/LojaContext';
import { Mail, Phone, MapPin, Instagram, Facebook, Shield, FileText, BadgeCheck, AlertTriangle } from 'lucide-react';

export default function LojaFooter() {
  const loja = useLojaInfo();
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      {/* Seção Principal */}
      <div 
        className="py-8"
        style={{ backgroundColor: loja.cor_primaria, color: 'white' }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sobre a Loja */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BadgeCheck size={18} />
                Revendedor(a) Autorizado(a)
              </h3>
              <p className="text-sm opacity-90 mb-2">
                {loja.nome}
              </p>
              <p className="text-xs opacity-75">
                {loja.descricao || 'Produtos de qualidade com atendimento personalizado.'}
              </p>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-lg font-bold mb-4">Contato</h3>
              <div className="space-y-2 text-sm opacity-90">
                {loja.whatsapp && (
                  <a 
                    href={`https://wa.me/55${loja.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <Phone size={16} />
                    <span>{loja.whatsapp}</span>
                  </a>
                )}
                {loja.email_contato && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>{loja.email_contato}</span>
                  </div>
                )}
                {loja.endereco && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{loja.endereco}</span>
                  </div>
                )}
              </div>

              {/* Redes Sociais */}
              {(loja.instagram || loja.facebook) && (
                <div className="mt-4 flex gap-3">
                  {loja.instagram && (
                    <a 
                      href={loja.instagram.startsWith('http') ? loja.instagram : `https://instagram.com/${loja.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:opacity-80 transition"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      aria-label="Instagram"
                    >
                      <Instagram size={18} />
                    </a>
                  )}
                  {loja.facebook && (
                    <a 
                      href={loja.facebook.startsWith('http') ? loja.facebook : `https://facebook.com/${loja.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:opacity-80 transition"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Links Legais */}
            <div>
              <h3 className="text-lg font-bold mb-4">Informações</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li>
                  <Link href="/termos" className="flex items-center gap-2 hover:opacity-80">
                    <FileText size={14} />
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="flex items-center gap-2 hover:opacity-80">
                    <Shield size={14} />
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            {/* Segurança */}
            <div>
              <h3 className="text-lg font-bold mb-4">Segurança</h3>
              <div className="text-sm opacity-90 space-y-2">
                <p className="flex items-start gap-2">
                  <Shield size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Site 100% seguro com certificado SSL</span>
                </p>
                <p className="flex items-start gap-2">
                  <BadgeCheck size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Pagamento processado por gateways confiáveis</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer / Aviso Legal */}
      <div className="bg-gray-900 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
            <AlertTriangle size={14} className="text-yellow-500" />
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">AVISO:</strong> Esta loja é operada por um(a) <strong className="text-white">Revendedor(a) Independente Autorizado(a)</strong>. 
              O(A) revendedor(a) é integralmente responsável por suas vendas, atendimento e entregas. 
              A marca não se responsabiliza por transações realizadas através desta loja.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-950 py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            © {anoAtual} {loja.nome} - Todos os direitos reservados | 
            Desenvolvido por <span className="text-gray-400">C4 Franquias</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
