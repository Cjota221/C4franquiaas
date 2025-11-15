"use client";
import { useState, useEffect } from 'react';
import { Upload, Palette } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PersonalizacaoRevendedora() {
  const [storeName, setStoreName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#ec4899');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomization();
  }, []);

  const loadCustomization = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('resellers').select('*').single();
    if (data) {
      setStoreName(data.store_name || '');
      if (data.colors) {
        setPrimaryColor(data.colors.primary || '#ec4899');
        setSecondaryColor(data.colors.secondary || '#8b5cf6');
      }
      setLogoPreview(data.logo_url || '');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    
    let logoUrl = logoPreview;
    
    if (logo) {
      const fileName = `logo-${Date.now()}.${logo.name.split('.').pop()}`;
      const { data: uploadData, error } = await supabase.storage
        .from('reseller-logos')
        .upload(fileName, logo);
      
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('reseller-logos')
          .getPublicUrl(uploadData.path);
        logoUrl = urlData.publicUrl;
      }
    }

    await supabase
      .from('resellers')
      .update({
        store_name: storeName,
        logo_url: logoUrl,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
        },
      })
      .eq('id', (await supabase.from('resellers').select('id').single()).data?.id);

    setLoading(false);
    alert('Personalização salva com sucesso!');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personalização</h1>
        <p className="text-gray-500 mt-1">Customize a aparência do seu catálogo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informações da Loja</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="Minha Loja"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload size={20} />
              Logo da Loja
            </h3>
            <div className="space-y-4">
              {logoPreview && (
                <div className="w-32 h-32 mx-auto border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                </div>
              )}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <span className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Upload size={18} />
                  Escolher Imagem
                </span>
              </label>
              <p className="text-xs text-gray-500 text-center">PNG, JPG ou SVG (max 2MB)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette size={20} />
              Cores da Marca
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Personalização'}
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preview do Catálogo</h3>
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <div
              className="p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {logoPreview && (
                <div className="w-20 h-20 bg-white rounded-lg p-2 mb-4">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <h2 className="text-2xl font-bold">{storeName || 'Nome da Loja'}</h2>
              <p className="text-sm opacity-90 mt-1">Catálogo de Produtos</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-lg" />
                ))}
              </div>
              <button
                className="w-full mt-4 py-3 text-white font-medium rounded-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Comprar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}