
"use client";

import React, { useState, useEffect } from 'react';

// Define a interface para o relatório de layout para garantir a tipagem
interface LayoutReport {
  timestamp: string;
  url: string;
  viewport: { width: number; height: number };
  analysis: {
    totalElementsAnalyzed: number;
    issuesFound: number;
  };
  issues: {
    [key: string]: Record<string, unknown>[];
  };
}

const DebugPage: React.FC = () => {
  const [report, setReport] = useState<LayoutReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para verificar se a ferramenta de debug está disponível no `window`
  useEffect(() => {
    if (typeof window.runLayoutAnalysis !== 'function') {
      setError("A ferramenta de diagnóstico (`runLayoutAnalysis`) não foi encontrada. Verifique se o script foi carregado corretamente no layout principal.");
    }
  }, []);

  const handleRunAnalysis = () => {
    if (typeof window.runLayoutAnalysis !== 'function') {
      setError("A função `runLayoutAnalysis` não está disponível. O script de debug pode não ter sido carregado.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    // A função é assíncrona para dar tempo da UI atualizar
    setTimeout(() => {
      try {
        const analysisResult = window.runLayoutAnalysis();
        setReport(analysisResult);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(`Ocorreu um erro durante a análise: ${e.message}`);
        } else {
          setError("Ocorreu um erro desconhecido durante a análise.");
        }
        console.error(e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 100); // Pequeno delay para feedback visual
  };

  const renderIssues = (issues: { [key: string]: Record<string, unknown>[] }) => {
    const issueEntries = Object.entries(issues).filter(([, value]) => value.length > 0);

    if (issueEntries.length === 0) {
      return <p className="text-green-600">Nenhum problema de layout detectado automaticamente.</p>;
    }

    return (
      <div className="space-y-4">
        {issueEntries.map(([key, value]) => (
          <div key={key} className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 capitalize mb-2">{key.replace(/([A-Z])/g, ' $1')} ({value.length})</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {value.slice(0, 5).map((issue, index) => ( // Limita a 5 itens para não poluir a tela
                <li key={index} className="font-mono bg-gray-50 p-1 rounded">
                  {String(issue.selector)}
                  {issue.zIndex && ` (z-index: ${issue.zIndex})`}
                  {issue.fontSize && ` (font-size: ${issue.fontSize})`}
                </li>
              ))}
              {value.length > 5 && <li className="text-gray-500">... e mais {value.length - 5} outros.</li>}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <header className="border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Diagnóstico de Layout</h1>
          <p className="text-gray-500 mt-1">
            Esta página executa uma análise no DOM para detectar problemas comuns de layout e CSS.
          </p>
        </header>

        <div className="mb-6">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !!error}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isAnalyzing ? 'Analisando...' : 'Iniciar Análise de Layout'}
          </button>
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>

        {isAnalyzing && (
          <div className="text-center p-4">
            <p className="text-lg text-blue-600">Executando análise, por favor aguarde...</p>
          </div>
        )}

        {report && (
          <section id="report-section">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Relatório da Análise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-600">Total de Elementos</div>
                <div className="text-2xl font-bold">{report.analysis.totalElementsAnalyzed}</div>
              </div>
              <div className={`p-4 rounded-lg ${report.analysis.issuesFound > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <div className={`text-sm ${report.analysis.issuesFound > 0 ? 'text-red-700' : 'text-green-700'}`}>Problemas Encontrados</div>
                <div className={`text-2xl font-bold ${report.analysis.issuesFound > 0 ? 'text-red-800' : 'text-green-800'}`}>{report.analysis.issuesFound}</div>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                O relatório completo foi baixado como um arquivo JSON. Abaixo está um resumo dos principais problemas encontrados.
              </p>
              {renderIssues(report.issues)}
            </div>
          </section>
        )}

        {!report && !isAnalyzing && (
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700">Aguardando análise</h3>
            <p className="text-gray-500 mt-1">
              Clique no botão &apos;Iniciar Análise&apos; para inspecionar o layout da página atual.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPage;

// Adiciona a declaração no escopo da window para o TypeScript
declare global {
  interface Window {
    runLayoutAnalysis: () => LayoutReport;
  }
}
