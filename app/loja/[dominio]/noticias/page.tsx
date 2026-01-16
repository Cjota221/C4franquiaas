/**
 * 📰 PÁGINA DE NOTÍCIAS DA LOJA
 * 
 * Rota: /loja/[dominio]/noticias
 * Lista todas as notícias ativas da loja
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLojaInfo } from '@/contexts/LojaContext';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';

interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  imagem?: string;
  slug: string;
  autor?: string;
  data_publicacao: string;
}

export default function NoticiasPage() {
  const params = useParams();
  const loja = useLojaInfo();
  const dominio = params.dominio as string;
  
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  useEffect(() => {
    async function loadNoticias() {
      try {
        const response = await fetch(`/api/loja/${dominio}/noticias`);
        if (response.ok) {
          const data = await response.json();
          setNoticias(data.noticias || []);
        }
      } catch (error) {
        console.error('Erro ao carregar notícias:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (dominio) {
      loadNoticias();
    }
  }, [dominio]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: corPrimaria }}></div>
        <p className="mt-4 text-gray-600">Carregando notícias...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <Newspaper className="w-8 h-8" style={{ color: corPrimaria }} />
            <h1 className="text-3xl font-bold text-gray-900">Notícias</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Fique por dentro das novidades e atualizações
          </p>
        </div>
      </div>

      {/* Lista de Notícias */}
      <div className="container mx-auto px-4 py-8">
        {noticias.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Nenhuma notícia ainda</h2>
            <p className="text-gray-500 mt-2">Em breve teremos novidades por aqui!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticias.map((noticia) => (
              <Link
                key={noticia.id}
                href={`/loja/${dominio}/noticias/${noticia.slug}`}
                className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Imagem */}
                <div className="relative h-48 bg-gray-100">
                  {noticia.imagem ? (
                    <Image
                      src={noticia.imagem}
                      alt={noticia.titulo}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${corPrimaria}15` }}
                    >
                      <Newspaper className="w-12 h-12" style={{ color: corPrimaria }} />
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(noticia.data_publicacao)}</span>
                    {noticia.autor && (
                      <>
                        <span>•</span>
                        <span>{noticia.autor}</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 mb-2">
                    {noticia.titulo}
                  </h2>

                  {noticia.resumo && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {noticia.resumo}
                    </p>
                  )}

                  <div 
                    className="flex items-center gap-1 text-sm font-medium"
                    style={{ color: corPrimaria }}
                  >
                    Ler mais
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
