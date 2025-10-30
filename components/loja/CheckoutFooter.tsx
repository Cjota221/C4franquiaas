"use client";
import React from 'react';
import { useLojaInfo } from '@/contexts/LojaContext';

export default function CheckoutFooter() {
  const loja = useLojaInfo();
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center text-sm text-gray-600">
          <p>
            © {anoAtual} {loja.nome} - Todos os direitos reservados
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Loja franqueada • Desenvolvido por <span className="font-semibold">C4 Franquias</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
