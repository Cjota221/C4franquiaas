"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Props = {
  productId?: number | null;
};

export default function DebugVariacoes({ productId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<Record<string, unknown> | null>(null);
  const [api, setApi] = useState<unknown>(null);
  const [active, setActive] = useState<'db' | 'api' | 'comparison'>('comparison');

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const resp = await axios.get(`/api/produtos/${productId}`);
        setDb((resp.data?.produto ?? null) as Record<string, unknown> | null);
        setApi(resp.data?.facilzap ?? null as unknown);
      } catch (err: unknown) {
        const e = err as unknown;
        if (typeof e === 'object' && e !== null && 'message' in (e as Record<string, unknown>)) {
          setError(String((e as Record<string, unknown>)['message']));
        } else {
          setError('Erro ao buscar dados');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  const shallowDiff = (a: unknown, b: unknown) => {
    const out: Array<{ key: string; db: unknown; api: unknown }> = [];
    const ak = a && typeof a === 'object' && !Array.isArray(a) ? Object.keys(a as Record<string, unknown>) : [];
    const bk = b && typeof b === 'object' && !Array.isArray(b) ? Object.keys(b as Record<string, unknown>) : [];
    const keys = Array.from(new Set([...ak, ...bk]));
    for (const k of keys) {
      const va = a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined;
      const vb = b && typeof b === 'object' ? (b as Record<string, unknown>)[k] : undefined;
      if (JSON.stringify(va) !== JSON.stringify(vb)) out.push({ key: k, db: va, api: vb });
    }
    return out;
  };

  const varsDiff = () => {
    const out: Array<{ index: number; db: unknown; api: unknown }> = [];
    const apiVars = Array.isArray((api as Record<string, unknown> | undefined)?.['variacoes']) ? (api as Record<string, unknown>)['variacoes'] as unknown[] : [];
    const dbVars = Array.isArray((db as Record<string, unknown> | undefined)?.['variacoes_meta']) ? (db as Record<string, unknown>)['variacoes_meta'] as unknown[] : [];
    const len = Math.max(apiVars.length, dbVars.length);
    for (let i = 0; i < len; i++) {
      const a = apiVars[i] ?? null;
      const d = dbVars[i] ?? null;
      if (JSON.stringify(a) !== JSON.stringify(d)) out.push({ index: i, api: a, db: d });
    }
    return out;
  };

  return (
    <div className="my-4 p-3 border rounded bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setActive('db')} className={`px-3 py-1 rounded ${active === 'db' ? 'bg-white border' : 'bg-gray-100'}`}>Database</button>
        <button onClick={() => setActive('api')} className={`px-3 py-1 rounded ${active === 'api' ? 'bg-white border' : 'bg-gray-100'}`}>API (FácilZap)</button>
        <button onClick={() => setActive('comparison')} className={`px-3 py-1 rounded ${active === 'comparison' ? 'bg-white border' : 'bg-gray-100'}`}>Comparison</button>
        <div className="ml-auto text-xs text-gray-500">{loading ? 'Carregando...' : error ? 'Erro' : 'Pronto'}</div>
        <button
          onClick={() => {
            const payload = active === 'db' ? db : active === 'api' ? api : { db, api, diffs: shallowDiff(db, api), vars: varsDiff() };
            copy(JSON.stringify(payload, null, 2));
          }}
          className="px-2 py-1 text-sm bg-white border rounded"
        >
          Copiar
        </button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {active === 'db' && <pre className="text-xs max-h-64 overflow-auto p-2 bg-white border rounded">{JSON.stringify(db, null, 2)}</pre>}

      {active === 'api' && <pre className="text-xs max-h-64 overflow-auto p-2 bg-white border rounded">{JSON.stringify(api, null, 2)}</pre>}

      {active === 'comparison' && (
        <>
          <div className="mb-2 text-sm font-medium">Top-level diffs</div>
          <div className="max-h-36 overflow-auto p-2 bg-white border rounded text-xs">
            {(!db && !api) ? (
              <div className="text-gray-500">Sem dados</div>
            ) : (() => {
              const d = shallowDiff(db, api);
              if (d.length === 0) return <div className="text-green-600">Sem diferenças de top-level</div>;
              return d.map((item, i) => (
                <div key={i} className="mb-1 border-b pb-1">
                  <div className="text-xs font-semibold">{item.key}</div>
                  <div className="text-xs text-gray-700"><span className="font-semibold">DB:</span> {JSON.stringify(item.db)}</div>
                  <div className="text-xs text-gray-700"><span className="font-semibold">API:</span> {JSON.stringify(item.api)}</div>
                </div>
              ));
            })()}
          </div>

          <div className="mt-3 text-sm font-medium">Variações diferenças</div>
          <div className="max-h-48 overflow-auto p-2 bg-white border rounded text-xs">
            {varsDiff().length === 0 ? (
              <div className="text-green-600">Sem diferenças nas variações</div>
            ) : (
              varsDiff().map((it) => (
                <div key={it.index} className="mb-2 border-b pb-2">
                  <div className="text-xs font-semibold">Index {it.index}</div>
                  <div className="text-xs text-gray-700"><span className="font-semibold">DB:</span> {JSON.stringify(it.db)}</div>
                  <div className="text-xs text-gray-700"><span className="font-semibold">API:</span> {JSON.stringify(it.api)}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
