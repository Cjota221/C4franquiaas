"use client";
import React, { useEffect, useState } from 'react';
import { Store, Copy, ExternalLink, Save, Upload, AlertCircle } from 'lucide-react';

type Loja = {
  id: string;
  nome: string;
  dominio: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  produtos_ativos: number;
};

export default function LojaPage() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [dominio, setDominio] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [corPrimaria, setCorPrimaria] = useState('#DB1472');
  const [corSecundaria, setCorSecundaria] = useState('#F8B81F');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    loadLoja();
  }, []);

  async function loadLoja() {
    try {
      const res = await fetch('/api/franqueada/loja');
      if (!res.ok) throw new Error('Erro ao carregar loja');
      const json = await res.json();

      if (json.loja) {
        setLoja(json.loja);
        setNome(json.loja.nome);
        setDominio(json.loja.dominio);
        setLogo(json.loja.logo);
        setCorPrimaria(json.loja.cor_primaria);
        setCorSecundaria(json.loja.cor_secundaria);
        setAtivo(json.loja.ativo);
      }
    } catch (err) {
      console.error('Erro ao carregar loja:', err);
      setError('Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!nome || !dominio) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = loja ? '/api/franqueada/loja/update' : '/api/franqueada/loja';
      const method = loja ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          dominio,
          logo,
          cor_primaria: corPrimaria,
          cor_secundaria: corSecundaria,
          ativo
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erro ao salvar loja');
      }

      const json = await res.json();
      setLoja(json.loja);
      setSuccess('Loja salva com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar loja:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar loja');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/franqueada/loja/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erro ao fazer upload');
      }

      const json = await res.json();
      setLogo(json.url);
      setSuccess('Logo enviada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploadingLogo(false);
    }
  }

  function copyLink() {
    const link = `https://c4franquiaas.netlify.app/loja/${dominio}`;
    navigator.clipboard.writeText(link);
    setSuccess('Link copiado!');
    setTimeout(() => setSuccess(''), 2000);
  }

  function openLoja() {
    window.open(`/loja/${dominio}`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Store className="text-pink-600" size={36} />
          Minha Loja
        </h1>
        <p className="text-gray-600 mt-2">
          {loja ? 'Configure sua loja online' : 'Crie sua loja online e comece a vender!'}
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna 1: Configurações */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Configurações</h2>

          {/* Nome da Loja */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Nome da Loja <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Cosméticos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Domínio */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Domínio (URL) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={dominio}
                onChange={(e) => setDominio(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="Ex: mariacosmeticos"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600 whitespace-nowrap">
                .c4franquias.com
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Apenas letras minúsculas e números, sem espaços (mínimo 3 caracteres)
            </p>
          </div>

          {/* Logo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {logo && (
                <div className="relative w-20 h-20 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain border-2 border-gray-200 rounded-lg p-1" 
                  />
                </div>
              )}
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                <Upload size={16} />
                {uploadingLogo ? 'Enviando...' : 'Escolher Arquivo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP ou SVG (máximo 2MB)
            </p>
          </div>

          {/* Cor Primária */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Cor Primária
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="w-14 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                placeholder="#DB1472"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cor principal da sua loja (header, botões)
            </p>
          </div>

          {/* Cor Secundária */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Cor Secundária
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={corSecundaria}
                onChange={(e) => setCorSecundaria(e.target.value)}
                className="w-14 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={corSecundaria}
                onChange={(e) => setCorSecundaria(e.target.value)}
                placeholder="#F8B81F"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cor de destaque (badges, ícones)
            </p>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
              />
              <div>
                <span className="text-sm font-medium block">Loja Ativa</span>
                <span className="text-xs text-gray-500">
                  {ativo ? 'Sua loja está online e visível' : 'Sua loja está offline e não pode ser acessada'}
                </span>
              </div>
            </label>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving || !nome || !dominio}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {/* Coluna 2: Preview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Preview</h2>

          <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
            {/* Header Preview */}
            <div 
              className="p-4 flex items-center justify-between"
              style={{ backgroundColor: corPrimaria }}
            >
              <div className="flex items-center gap-3">
                {logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logo} alt="Logo" className="w-10 h-10 object-contain bg-white rounded p-1" />
                ) : (
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-xl font-bold" style={{ color: corPrimaria }}>
                    {nome.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-white font-bold truncate">{nome || 'Nome da Loja'}</span>
              </div>
              <div className="flex items-center gap-4 text-white text-xl">
                <span>🏠</span>
                <span>📦</span>
                <span>🛒</span>
              </div>
            </div>

            {/* Content Preview */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4" style={{ color: corPrimaria }}>
                Produtos em Destaque
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                      Produto {i}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">Produto Exemplo</p>
                    <p className="text-lg font-bold" style={{ color: corPrimaria }}>
                      R$ 99,90
                    </p>
                    <button
                      className="w-full mt-2 py-1 text-xs font-medium text-white rounded transition"
                      style={{ backgroundColor: corSecundaria }}
                    >
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Preview */}
            <div 
              className="p-4 text-white text-center text-sm"
              style={{ backgroundColor: corPrimaria }}
            >
              © {new Date().getFullYear()} {nome || 'Sua Loja'}
            </div>
          </div>

          {/* Link da Loja */}
          {loja && dominio && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                🔗 Link da sua loja:
              </p>
              <p className="text-sm text-blue-600 break-all mb-3 font-mono">
                https://c4franquiaas.netlify.app/loja/{dominio}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copiar Link
                </button>
                <button
                  onClick={openLoja}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Abrir Loja
                </button>
              </div>
            </div>
          )}

          {/* Info sobre bucket */}
          {!loja && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 Dica:</strong> Após criar sua loja, você poderá acessá-la pelo link único e compartilhar com seus clientes!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
