"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Upload, 
  Palette, 
  Type, 
  Share2,
  BarChart3
} from "lucide-react";

const sections = [
  {
    id: "overview",
    name: "Visão Geral",
    href: "/revendedora/personalizacao",
    icon: LayoutDashboard,
  },
  {
    id: "banner",
    name: "Banners",
    href: "/revendedora/personalizacao/banner",
    icon: ImageIcon,
  },
  {
    id: "logo",
    name: "Logo",
    href: "/revendedora/personalizacao/logo",
    icon: Upload,
  },
  {
    id: "cores",
    name: "Cores",
    href: "/revendedora/personalizacao/cores",
    icon: Palette,
  },
  {
    id: "estilos",
    name: "Estilos",
    href: "/revendedora/personalizacao/estilos",
    icon: Type,
  },
  {
    id: "redes-sociais",
    name: "Redes Sociais",
    href: "/revendedora/personalizacao/redes-sociais",
    icon: Share2,
  },
  {
    id: "analytics",
    name: "Analytics",
    href: "/revendedora/personalizacao/analytics",
    icon: BarChart3,
  },
];

export default function PersonalizacaoNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;

            return (
              <Link
                key={section.id}
                href={section.href}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                  ${
                    isActive
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon size={18} />
                {section.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
