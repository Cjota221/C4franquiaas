// Função para validar e corrigir cor hexadecimal
export function validateHexColor(color: string | null | undefined | unknown, fallback: string = '#8B5CF6'): string {
  if (!color || typeof color !== 'string') return fallback;
  
  // Remove espaços e converte para string
  const cleanColor = color.trim();
  
  // Verifica se é uma cor hexadecimal válida
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (hexPattern.test(cleanColor)) {
    return cleanColor;
  }
  
  // Se começar com # mas não tiver 6 caracteres, tenta completar
  if (cleanColor.startsWith('#')) {
    const hex = cleanColor.slice(1);
    if (hex.length <= 6) {
      // Completa com zeros à direita se necessário
      const padded = hex.padEnd(6, '0');
      // Verifica se todos os caracteres são hexadecimais válidos
      if (/^[0-9A-Fa-f]+$/.test(hex)) {
        return `#${padded}`;
      }
    }
  }
  
  // Se não conseguir validar, retorna o fallback
  console.warn(`Cor inválida: "${color}", usando fallback: "${fallback}"`);
  return fallback;
}

// Função para garantir que uma cor seja segura para uso em CSS
export function safeColor(color: string | null | undefined | unknown, fallback: string = '#8B5CF6'): string {
  return validateHexColor(color, fallback);
}