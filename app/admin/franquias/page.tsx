// Garante que este componente só será usado no lado do cliente
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { PlusCircle } from 'lucide-react';
import ModalFranquia from '@/components/ModalFranquia'; // Importa nosso modal

// Interface para definir o tipo de dados de uma franquia
interface Franquia {
  id: number;
  nome: string;
  dominio: string;
  logo: string;
  ativo: boolean;
}

// Dados de exemplo das franquias (virão do Supabase no futuro)
const mockFranquias: Franquia[] = [
  { id: 1, nome: 'Franquia Centro', dominio: 'centro.c4franquias.com.br', logo: 'https://placehold.co/64x64/F8B81F/FFF?text=C4', ativo: true },
  { id: 2, nome: 'Franquia Sul', dominio: 'sul.c4franquias.com.br', logo: 'https://placehold.co/64x64/F8B81F/FFF?text=C4', ativo: true },
  { id: 3, nome: 'Franquia Norte', dominio: 'norte.c4franquias.com.br', logo: 'https://placehold.co/64x64/F8B81F/FFF?text=C4', ativo: false },
];

// Componente da página de Franquias
export default function FranquiasPage() {
  const [franquias, setFranquias] = useState<Franquia[]>(mockFranquias);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para salvar uma nova franquia (vinda do modal)
  const handleSaveFranquia = (novaFranquia: { nome: string; dominio: string; logo: string }) => {
    const nova: Franquia = {
      id: franquias.length + 1, // Simula um novo ID
      ...novaFranquia,
      ativo: true,
    };
    setFranquias([...franquias, nova]);
    setIsModalOpen(false); // Fecha o modal após salvar
    alert(`Franquia "${nova.nome}" cadastrada com sucesso!`);
  };
  
  // Função para mudar o status de uma franquia
  const toggleAtivo = (id: number) => {
    setFranquias(franquias.map(f => 
      f.id === id ? { ...f, ativo: !f.ativo } : f
    ));
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho com título e botão de ação */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#333]">Gerenciamento de Franquias</h1>
          <p className="text-lg text-gray-500 mt-1">Cadastre e gerencie as franquias da rede.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#DB1472] text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-pink-600 transition-colors"
        >
          <PlusCircle size={20} />
          Nova Franqueada
        </button>
      </header>

      {/* Tabela de franquias */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-4">Franqueada</th>
                <th className="p-4">Domínio</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {franquias.map((franquia) => (
                  <tr key={franquia.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                      <Image src={franquia.logo} alt={franquia.nome} width={48} height={48} className="object-cover" />
                    </div>
                    <span className="font-semibold">{franquia.nome}</span>
                  </td>
                  <td className="p-4">{franquia.dominio}</td>
                  <td className="p-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={franquia.ativo}
                        onChange={() => toggleAtivo(franquia.id)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DB1472]"></div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Renderiza o Modal de cadastro */}
      <ModalFranquia 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFranquia}
      />
    </div>
  );
}
