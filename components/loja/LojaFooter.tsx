"use client";
import React from 'react';
import { useLojaInfo } from '@/contexts/LojaContext';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

export default function LojaFooter() {
  const loja = useLojaInfo();
  const anoAtual = new Date().getFullYear();

  return (
    <footer 
      className="mt-auto py-8"
      style={{ backgroundColor: loja.cor_primaria, color: 'white' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre a Loja Franqueada */}
          <div>
            <h3 className="text-lg font-bold mb-4">Sobre {loja.nome}</h3>
            <p className="text-sm opacity-90 mb-2">
              Loja franqueada com produtos de qualidade e atendimento personalizado.
            </p>
            <p className="text-xs opacity-75 italic">
              Loja independente operada por franqueado(a) autorizado(a)
            </p>
          </div>

          {/* Centro de Distribuição */}
          <div>
            <h3 className="text-lg font-bold mb-4">Centro de Distribuição</h3>
            <div className="space-y-2 text-sm opacity-90">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Av. Independência Q 140, 3512<br />
                  St. Central, Goiânia - GO<br />
                  CEP: 74055-045, Brasil
                </span>
              </div>
            </div>
          </div>

          {/* Contato da Franqueada */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <div className="space-y-2 text-sm opacity-90">
              {loja.whatsapp && (
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>{loja.whatsapp}</span>
                </div>
              )}
              {loja.email_contato && (
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{loja.email_contato}</span>
                </div>
              )}
              {!loja.email_contato && !loja.whatsapp && (
                <p className="text-xs opacity-75">
                  Entre em contato através das nossas redes sociais
                </p>
              )}
            </div>

            {/* Redes Sociais */}
            {(loja.instagram || loja.facebook) && (
              <div className="mt-4">
                <div className="flex gap-3">
                  {loja.instagram && (
                    <a 
                      href={loja.instagram.startsWith('http') ? loja.instagram : `https://instagram.com/${loja.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:opacity-80 transition"
                      style={{ backgroundColor: loja.cor_secundaria }}
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
                      style={{ backgroundColor: loja.cor_secundaria }}
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm opacity-75">
          <p>© {anoAtual} {loja.nome} - Todos os direitos reservados</p>
          <p className="mt-1">Desenvolvido por <span className="font-semibold">C4 Franquias</span></p>
        </div>
      </div>
    </footer>
  );
}
