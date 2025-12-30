"use client";

import Head from 'next/head';
import { useEffect } from 'react';

interface CatalogoMetaTagsProps {
  storeName: string;
  slug: string;
  bio?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export default function CatalogoMetaTags({
  storeName,
  slug,
  bio,
  logoUrl,
  bannerUrl
}: CatalogoMetaTagsProps) {
  
  const title = `${storeName} - Catálogo de Produtos`;
  const description = bio 
    ? bio.substring(0, 160) 
    : `Confira o catálogo completo de produtos da ${storeName}. Moda feminina, acessórios e muito mais!`;
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://c4franquias.com'}/catalogo/${slug}`;
  const image = bannerUrl || logoUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://c4franquias.com'}/og-image.png`;

  // Atualizar meta tags dinamicamente
  useEffect(() => {
    // Title
    document.title = title;

    // Meta tags básicas
    updateMetaTag('description', description);
    updateMetaTag('keywords', `${storeName}, moda feminina, catálogo, produtos, roupas, acessórios`);

    // Open Graph
    updateMetaProperty('og:title', title);
    updateMetaProperty('og:description', description);
    updateMetaProperty('og:url', url);
    updateMetaProperty('og:image', image);
    updateMetaProperty('og:type', 'website');
    updateMetaProperty('og:site_name', 'C4 Franquias');

    // Twitter Card
    updateMetaProperty('twitter:card', 'summary_large_image');
    updateMetaProperty('twitter:title', title);
    updateMetaProperty('twitter:description', description);
    updateMetaProperty('twitter:image', image);

    // Canonical
    updateLinkTag('canonical', url);
  }, [title, description, url, image, storeName, slug]);

  function updateMetaTag(name: string, content: string) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  function updateMetaProperty(property: string, content: string) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  function updateLinkTag(rel: string, href: string) {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }
    link.href = href;
  }

  return null; // Este componente não renderiza nada visualmente
}
