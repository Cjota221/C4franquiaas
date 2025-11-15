"use client";
import Image from 'next/image';
import { useState } from 'react';
import { Percent } from 'lucide-react';

interface ProductCardRevendedoraProps {
  product: {
    id: string;
    nome: string;
    preco: number;
    imagem_url?: string;
    is_active?: boolean;
    margin_percent?: number;
  };
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onMarginChange: (id: string, margin: number) => Promise<void>;
}

export default function ProductCardRevendedora({ product, onToggle, onMarginChange }: ProductCardRevendedoraProps) {
  const [isActive, setIsActive] = useState(product.is_active ?? false);
  const [margin, setMargin] = useState(product.margin_percent ?? 30);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const finalPrice = product.preco * (1 + margin / 100);

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(product.id, !isActive);
    setIsActive(!isActive);
    setLoading(false);
  };

  const handleMarginSave = async () => {
    setLoading(true);
    await onMarginChange(product.id, margin);
    setIsEditing(false);
    setLoading(false);
  };

  return (
    <div className={`bg-white rounded-lg border-2 transition-all ${isActive ? 'border-pink-500' : 'border-gray-200'}`}>
      <div className="relative aspect-square">
        <Image src={product.imagem_url || '/placeholder.png'} alt={product.nome} fill className="object-cover rounded-t-lg" />
        <button onClick={handleToggle} disabled={loading} className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
          {isActive ? 'Ativo' : 'Inativo'}
        </button>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">{product.nome}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Preço base:</span>
            <span className="font-medium">R$ {product.preco.toFixed(2)}</span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} min="0" max="100" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
              <button onClick={handleMarginSave} disabled={loading} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
                OK
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-sm text-gray-600">Margem:</span>
              <span className="flex items-center gap-1 text-pink-600 font-medium">
                <Percent size={14} />
                {margin}%
              </span>
            </button>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Preço final:</span>
            <span className="text-lg font-bold text-pink-600">R$ {finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}