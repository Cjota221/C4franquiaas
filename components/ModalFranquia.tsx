// Garante que este componente só será usado no lado do cliente
"use client";

import React, { useState } from 'react';

// Define os tipos de dados que o componente espera receber
interface ModalFranquiaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (novaFranquia: { nome: string; dominio: string; logo: string }) => void;
}

const ModalFranquia: React.FC<ModalFranquiaProps> = ({ isOpen, onClose, onSave }) => {
  // Estados para armazenar os dados do formulário
  const [nome, setNome] = useState('');
  const [dominio, setDominio] = useState('');
  const [logo, setLogo] = useState('');

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  const handleSubmit = () => {
    // Validação simples para garantir que os campos não estão vazios
    if (nome && dominio) {
      onSave({ nome, dominio, logo });
      // Limpa os campos após salvar
      setNome('');
      setDominio('');
      setLogo('');
      onClose(); // Fecha o modal
    } else {
      alert("Por favor, preencha o nome e o domínio.");
    }
  };

  return (
    // Fundo escuro semi-transparente
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Conteúdo do Modal */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-[#333] mb-6">Nova Franqueada</h2>

        {/* Formulário */}
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Nome da Franqueada</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F8B81F] focus:border-[#F8B81F]"
              placeholder="Ex: C4 Franquia Campinas"
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Domínio</label>
            <input
              type="text"
              value={dominio}
              onChange={(e) => setDominio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F8B81F] focus:border-[#F8B81F]"
              placeholder="Ex: campinas.c4franquias.com.br"
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">URL da Logo (Opcional)</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F8B81F] focus:border-[#F8B81F]"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-[#333] font-bold rounded-lg hover:bg-gray-300 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-[#DB1472] text-white font-bold rounded-lg hover:bg-pink-700 transition-all"
          >
            Salvar Franqueada
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFranquia;
