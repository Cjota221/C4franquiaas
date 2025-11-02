"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Erro na autorização: ${error}`);
      setTimeout(() => router.push('/admin/configuracoes/melhorenvio'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Código de autorização não encontrado');
      setTimeout(() => router.push('/admin/configuracoes/melhorenvio'), 3000);
      return;
    }

    // Trocar o código pelo token
    fetch('/api/admin/melhorenvio/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage('Autorização concluída com sucesso!');
          setTimeout(() => router.push('/admin/configuracoes/melhorenvio'), 2000);
        } else {
          setStatus('error');
          // Mostrar detalhes do erro se disponível
          const errorMsg = data.error || 'Erro ao processar autorização';
          const details = data.details ? JSON.stringify(data.details, null, 2) : '';
          setMessage(`${errorMsg}\n\nDetalhes: ${details}\n\nStatus HTTP: ${data.status || 'desconhecido'}`);
          setTimeout(() => router.push('/admin/configuracoes/melhorenvio'), 5000);
        }
      })
      .catch(err => {
        console.error('Erro:', err);
        setStatus('error');
        setMessage('Erro ao comunicar com o servidor');
        setTimeout(() => router.push('/admin/configuracoes/melhorenvio'), 3000);
      });
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processando...
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sucesso!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">
              Redirecionando...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erro
            </h2>
            <pre className="text-gray-600 text-sm whitespace-pre-wrap text-left bg-gray-100 p-4 rounded max-w-lg overflow-auto max-h-64">
              {message}
            </pre>
            <p className="text-sm text-gray-500 mt-4">
              Redirecionando em 5 segundos...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MelhorEnvioCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
