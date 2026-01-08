'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  Check, 
  Ban, 
  ExternalLink, 
  MessageCircle, 
  Copy, 
  Phone, 
  Mail, 
  Store, 
  Calendar,
  Eye,
  Package,
  Palette,
  ImageIcon,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { RevendedoraCompleta, getMensagemBoasVindas } from './types';

interface RevendedoraDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  revendedora: RevendedoraCompleta | null;
  onAprovar: (id: string) => Promise<void>;
  onRejeitar: (id: string) => void; // Abre o modal de rejeição
  onToggleAtivo: (id: string, ativoAtual: boolean) => Promise<void>;
  loadingActions: Record<string, boolean>;
}

export default function RevendedoraDetailsPanel({
  isOpen,
  onClose,
  revendedora,
  onAprovar,
  onRejeitar,
  onToggleAtivo,
  loadingActions,
}: RevendedoraDetailsPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !revendedora) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://c4franquias.com';
  const mensagemWhatsApp = getMensagemBoasVindas(revendedora, baseUrl);
  const telefoneFormatado = revendedora.phone.replace(/\D/g, '');

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const abrirWhatsApp = () => {
    const url = `https://wa.me/55${telefoneFormatado}?text=${encodeURIComponent(mensagemWhatsApp)}`;
    window.open(url, '_blank');
  };

  const verCatalogo = () => {
    if (revendedora.slug) {
      window.open(`${baseUrl}/catalogo/${revendedora.slug}`, '_blank');
    } else {
      toast.error('Catálogo ainda não configurado');
    }
  };

  const getStatusBadge = () => {
    switch (revendedora.status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pendente
          </span>
        );
      case 'aprovada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Aprovada
          </span>
        );
      case 'rejeitada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Rejeitada
          </span>
        );
    }
  };

  const isLoading = (action: string) => loadingActions[`${revendedora.id}-${action}`];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#DB1472] to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{revendedora.name}</h2>
              <p className="text-sm text-white/80">{revendedora.store_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Status e Ativo */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                {revendedora.status === 'aprovada' && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    revendedora.is_active 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {revendedora.is_active ? (
                      <><ToggleRight className="w-4 h-4" /> Ativa</>
                    ) : (
                      <><ToggleLeft className="w-4 h-4" /> Inativa</>
                    )}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(revendedora.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Dados de Contato */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Informações de Contato
            </h3>
            
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{revendedora.email}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(revendedora.email, 'email')}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedField === 'email' 
                      ? 'bg-green-100 text-green-600' 
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Telefone */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{revendedora.phone}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(revendedora.phone, 'phone')}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedField === 'phone' 
                      ? 'bg-green-100 text-green-600' 
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  {copiedField === 'phone' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Slug/Loja */}
              {revendedora.slug && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">/catalogo/{revendedora.slug}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${baseUrl}/catalogo/${revendedora.slug}`, 'slug')}
                    className={`p-2 rounded-lg transition-colors ${
                      copiedField === 'slug' 
                        ? 'bg-green-100 text-green-600' 
                        : 'hover:bg-gray-200 text-gray-500'
                    }`}
                  >
                    {copiedField === 'slug' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Redes Sociais */}
          {(revendedora.instagram || revendedora.facebook || revendedora.tiktok) && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Redes Sociais
              </h3>
              <div className="space-y-2">
                {/* Instagram */}
                {revendedora.instagram && (
                  <a
                    href={`https://instagram.com/${revendedora.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Instagram</p>
                        <p className="text-xs text-gray-500">@{revendedora.instagram.replace('@', '')}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors" />
                  </a>
                )}

                {/* Facebook */}
                {revendedora.facebook && (
                  <a
                    href={revendedora.facebook.startsWith('http') ? revendedora.facebook : `https://facebook.com/${revendedora.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Facebook</p>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{revendedora.facebook}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </a>
                )}

                {/* TikTok */}
                {revendedora.tiktok && (
                  <a
                    href={`https://tiktok.com/@${revendedora.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">TikTok</p>
                        <p className="text-xs text-gray-500">@{revendedora.tiktok.replace('@', '')}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Métricas */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Métricas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Package className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                <p className="text-2xl font-bold text-purple-700">{revendedora.total_products}</p>
                <p className="text-xs text-purple-600">Produtos Vinculados</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Eye className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">{revendedora.catalog_views}</p>
                <p className="text-xs text-blue-600">Visualizações</p>
              </div>
            </div>
          </div>

          {/* Indicadores de Personalização */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Personalização
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                revendedora.has_logo ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                {revendedora.has_logo ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">Logo</span>
              </div>
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                revendedora.has_banner ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                {revendedora.has_banner ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">Banner</span>
              </div>
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                revendedora.has_colors ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                {revendedora.has_colors ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">Cores</span>
              </div>
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                revendedora.has_margin ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                {revendedora.has_margin ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">Margem</span>
              </div>
            </div>
          </div>

          {/* Imagens (Logo/Banners) */}
          {(revendedora.has_logo || revendedora.has_banner) && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Imagens Enviadas
              </h3>
              <div className="space-y-4">
                {revendedora.logo_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Logo</p>
                    <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={revendedora.logo_url}
                        alt="Logo"
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  </div>
                )}
                {revendedora.banner_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Banner Desktop</p>
                    <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={revendedora.banner_url}
                        alt="Banner Desktop"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  </div>
                )}
                {revendedora.banner_mobile_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Banner Mobile</p>
                    <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={revendedora.banner_mobile_url}
                        alt="Banner Mobile"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Motivo da Rejeição */}
          {revendedora.rejection_reason && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-red-700 mb-2">Motivo da Rejeição</h3>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{revendedora.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* WhatsApp - Mensagem */}
          {revendedora.status === 'aprovada' && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Mensagem de Boas-Vindas
              </h3>
              <div className="relative">
                <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto border border-green-200">
                  {mensagemWhatsApp}
                </div>
                <button
                  onClick={() => copyToClipboard(mensagemWhatsApp, 'mensagem')}
                  className={`absolute top-2 right-2 p-2 rounded-lg transition-colors ${
                    copiedField === 'mensagem' 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-white hover:bg-green-100 text-gray-500'
                  }`}
                >
                  {copiedField === 'mensagem' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Ações Fixas */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-3">
          {/* Ações de Status */}
          {revendedora.status === 'pendente' && (
            <div className="flex gap-3">
              <button
                onClick={() => onAprovar(revendedora.id)}
                disabled={isLoading('aprovar')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading('aprovar') ? (
                  <>
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Aprovando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Aprovar Cadastro
                  </>
                )}
              </button>
              <button
                onClick={() => onRejeitar(revendedora.id)}
                disabled={isLoading('rejeitar')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="w-5 h-5" />
                Rejeitar
              </button>
            </div>
          )}

          {revendedora.status === 'aprovada' && (
            <div className="flex gap-3">
              <button
                onClick={abrirWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={() => onToggleAtivo(revendedora.id, revendedora.is_active)}
                disabled={isLoading('toggle')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  revendedora.is_active 
                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isLoading('toggle') ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : revendedora.is_active ? (
                  <><ToggleLeft className="w-5 h-5" /> Desativar</>
                ) : (
                  <><ToggleRight className="w-5 h-5" /> Ativar</>
                )}
              </button>
            </div>
          )}

          {revendedora.status === 'rejeitada' && (
            <button
              onClick={() => onAprovar(revendedora.id)}
              disabled={isLoading('aprovar')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading('aprovar') ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Aprovando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Aprovar Agora
                </>
              )}
            </button>
          )}

          {/* Ver Catálogo */}
          {revendedora.slug && (
            <button
              onClick={verCatalogo}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Ver Catálogo
            </button>
          )}
        </div>
      </div>
    </>
  );
}
