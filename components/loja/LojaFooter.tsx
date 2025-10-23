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
          {/* Sobre */}
          <div>
            <h3 className="text-lg font-bold mb-4">Sobre {loja.nome}</h3>
            <p className="text-sm opacity-90">
              Cosméticos de qualidade com os melhores preços. 
              Entrega rápida e atendimento personalizado.
            </p>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <div className="space-y-2 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>(XX) XXXXX-XXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>contato@{loja.nome.toLowerCase().replace(/\s+/g, '')}.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Brasil</span>
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="text-lg font-bold mb-4">Redes Sociais</h3>
            <div className="flex gap-4">
              <button 
                className="p-2 rounded-full hover:opacity-80 transition"
                style={{ backgroundColor: loja.cor_secundaria }}
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </button>
              <button 
                className="p-2 rounded-full hover:opacity-80 transition"
                style={{ backgroundColor: loja.cor_secundaria }}
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm opacity-75">
          <p>© {anoAtual} {loja.nome}. Todos os direitos reservados.</p>
          <p className="mt-1">Desenvolvido com ❤️ por C4 Franquias</p>
        </div>
      </div>
    </footer>
  );
}
