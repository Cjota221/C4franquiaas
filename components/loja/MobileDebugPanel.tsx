"use client";
import { useEffect, useState } from "react";

export default function MobileDebugPanel({ totalFavoritos, totalItens }: { totalFavoritos: number; totalItens: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let count = 0;
    let timer: NodeJS.Timeout;
    const handler = () => {
      count++;
      clearTimeout(timer);
      if (count >= 3) { setShow(p => !p); count = 0; }
      else { timer = setTimeout(() => count = 0, 1000); }
    };
    document.addEventListener("touchstart", handler);
    return () => document.removeEventListener("touchstart", handler);
  }, []);

  if (!show) return null;

  const favBtn = typeof window !== "undefined" ? document.querySelector("[data-testid='favoritos-button']") : null;
  const fav = favBtn ? window.getComputedStyle(favBtn) : null;
  const favRect = favBtn ? favBtn.getBoundingClientRect() : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-95 text-white p-3 z-[9999] text-[10px] font-mono">
      <div className="flex justify-between mb-2">
        <h3 className="text-yellow-400 font-bold">DEBUG MOBILE</h3>
        <button onClick={() => setShow(false)} className="bg-red-600 px-2 py-1 rounded">X</button>
      </div>
      <div className="bg-gray-800 p-2 rounded mb-2">
        <div className="text-blue-400">Viewport: {typeof window !== "undefined" && window.innerWidth}px (Mobile: {typeof window !== "undefined" && window.innerWidth < 768 ? "SIM" : "NAO"})</div>
        <div>Favoritos: {totalFavoritos} | Carrinho: {totalItens}</div>
      </div>
      <div className="bg-gray-800 p-2 rounded">
        <div className="text-red-400 font-bold">FAVORITOS:</div>
        {favBtn ? (
          <>
            <div className="text-green-300">ENCONTRADO</div>
            <div>Display: {fav?.display} | Vis: {fav?.visibility}</div>
            <div>Width: {fav?.width} | Height: {fav?.height}</div>
            <div>Pos: {favRect?.left.toFixed(0)}px left, {favRect?.width.toFixed(0)}px wide</div>
          </>
        ) : (
          <div className="text-red-400 font-bold">NAO ENCONTRADO!</div>
        )}
      </div>
      <div className="text-center text-gray-400 text-[9px] mt-2">Toque 3x para fechar</div>
    </div>
  );
}
