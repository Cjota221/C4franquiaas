/**
 * 📰 PÁGINA DE NOTÍCIA INDIVIDUAL
 * 
 * Rota: /loja/[dominio]/noticias/[slug]
 * Exibe o conteúdo completo de uma notícia
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLojaInfo } from '@/contexts/LojaContext';
import { Calendar, ArrowLeft, Share2, User, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem?: string;
  slug: string;
  autor?: string;
  data_publicacao: string;
}

export default function NoticiaPage() {
  const params = useParams();
  const router = useRouter();
  const loja = useLojaInfo();
  
  const dominio = params.dominio as string;
  const slug = params.slug as string;
  
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);
  
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  useEffect(() => {
    async function loadNoticia() {
      try {
        const response = await fetch(`/api/loja/${dominio}/noticias/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setNoticia(data.noticia);
        } else {
          router.push(`/loja/${dominio}/noticias`);
        }
      } catch (error) {
        console.error('Erro ao carregar notícia:', error);
        router.push(`/loja/${dominio}/noticias`);
      } finally {
        setLoading(false);
      }
    }
    
    if (dominio && slug) {
      loadNoticia();
    }
  }, [dominio, slug, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: noticia?.titulo,
          text: noticia?.resumo,
          url,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: corPrimaria }}></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-700">Notícia não encontrada</h1>
        <Link 
          href={`/loja/${dominio}/noticias`}
          className="inline-flex items-center gap-2 mt-4 text-pink-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para notícias
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header com imagem */}
      {noticia.imagem && (
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={noticia.imagem}
            alt={noticia.titulo}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Navegação */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/loja/${dominio}/noticias`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>

        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(noticia.data_publicacao)}</span>
          </div>
          {noticia.autor && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{noticia.autor}</span>
            </div>
          )}
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {noticia.titulo}
        </h1>

        {/* Resumo */}
        {noticia.resumo && (
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {noticia.resumo}
          </p>
        )}

        {/* Conteúdo Markdown */}
        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-pink-600 prose-strong:text-gray-900">
          <ReactMarkdown>{noticia.conteudo}</ReactMarkdown>
        </article>

        {/* CTA Final */}
        <div 
          className="mt-12 p-6 rounded-2xl text-center"
          style={{ backgroundColor: `${corPrimaria}10` }}
        >
          <h3 className="text-xl font-semibold mb-2" style={{ color: corPrimaria }}>
            Gostou da novidade?
          </h3>
          <p className="text-gray-600 mb-4">
            Confira nossos produtos e aproveite!
          </p>
          <Link
            href={`/loja/${dominio}/produtos`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: corPrimaria }}
          >
            Ver Produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
