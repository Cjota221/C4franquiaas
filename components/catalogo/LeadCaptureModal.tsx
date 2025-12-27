"use client";
import React, { useState } from 'react';
import { X, User, Phone, ShoppingBag } from 'lucide-react';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
  primaryColor: string;
}

export default function LeadCaptureModal({ isOpen, onClose, onSubmit, primaryColor }: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  if (!isOpen) return null;

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata como (XX) XXXXX-XXXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Por favor, informe seu nome';
    }
    
    const phoneNumbers = phone.replace(/\D/g, '');
    if (!phoneNumbers || phoneNumbers.length < 10) {
      newErrors.phone = 'Por favor, informe um telefone válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(name.trim(), phone.replace(/\D/g, ''));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Quase lá! 🛒</h2>
                <p className="text-sm text-white/80">Só mais um passo</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Para adicionar produtos ao carrinho, precisamos de algumas informações:
          </p>

          {/* Nome */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu nome
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como podemos te chamar?"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition ${
                  errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-pink-200'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu WhatsApp
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={16}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition ${
                  errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-pink-200'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            Continuar comprando ✨
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Usamos essas informações apenas para facilitar seu atendimento 💜
          </p>
        </form>
      </div>
    </div>
  );
}
