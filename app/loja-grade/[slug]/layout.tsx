import { notFound } from 'next/navigation';
import { getConfigBySlug } from '@/lib/grade-fechada-config';
import Image from 'next/image';
import Link from 'next/link';
import { validateHexColor } from '@/lib/color-utils';

export default async function LojaGradeFechadaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getConfigBySlug(slug);

  if (!config) {
    notFound();
  }

  // Se o site não estiver ativo, mostrar página de manutenção
  if (!config.site_ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔧 Em Manutenção
          </h1>
          <p className="text-gray-600">
            Estamos preparando algo especial para você. Volte em breve!
          </p>
        </div>
      </div>
    );
  }

  return (
    <html lang="pt-BR">
      <head>
        <title>{config.titulo_site || 'Grade Fechada'}</title>
        <meta name="description" content={config.descricao_site} />
        <style>{`
          :root {
            --cor-primaria: ${validateHexColor(config?.cor_primaria)};
            --cor-secundaria: ${validateHexColor(config?.cor_secundaria, '#EC4899')};
          }
        `}</style>
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href={`/loja-grade/${slug}`} className="flex items-center gap-3">
                {config.logo_url ? (
                  <Image
                    src={config.logo_url}
                    alt={config.titulo_site}
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                  />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: validateHexColor(config?.cor_primaria) }}>
                    {String(config?.titulo_site || 'Grade Fechada')}
                  </span>
                )}
              </Link>

              {/* WhatsApp */}
              {config.whatsapp_numero && (
                <a
                  href={`https://wa.me/55${config.whatsapp_numero.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: validateHexColor(config?.cor_primaria) }}
                >
                  📱 WhatsApp
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p className="mb-2">{config.titulo_site}</p>
              {config.descricao_site && (
                <p className="text-sm text-gray-500">{config.descricao_site}</p>
              )}
              {config.whatsapp_numero && (
                <p className="text-sm text-gray-500 mt-2">
                  Contato: {config.whatsapp_numero}
                </p>
              )}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
