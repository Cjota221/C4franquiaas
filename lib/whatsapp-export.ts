/**
 * Utilitários para formatação de telefone para WhatsApp API
 * e exportação de dados para CSV
 */

/**
 * Formata um número de telefone para o padrão internacional do WhatsApp
 * Remove caracteres especiais e adiciona código do Brasil (55) se necessário
 * 
 * @param phone - Telefone no formato brasileiro ex: (62) 99999-8888
 * @returns Telefone formatado ex: 5562999998888 ou null se inválido
 */
export function formatPhoneForWhatsapp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começar com 0, remove (ex: 062 -> 62)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Se não tem pelo menos 10 dígitos (DDD + número), é inválido
  // Ex: 62999998888 = 11 dígitos (com 9) ou 6299998888 = 10 dígitos (sem 9)
  if (cleaned.length < 10) {
    return null;
  }
  
  // Se já começa com 55 (código do Brasil), retorna como está
  if (cleaned.startsWith('55')) {
    // Valida se tem tamanho correto: 55 + DDD (2) + número (8 ou 9) = 12 ou 13
    if (cleaned.length >= 12 && cleaned.length <= 13) {
      return cleaned;
    }
    return null;
  }
  
  // Adiciona o código do Brasil
  cleaned = '55' + cleaned;
  
  // Valida tamanho final: 55 + DDD (2) + número (8 ou 9) = 12 ou 13
  if (cleaned.length >= 12 && cleaned.length <= 13) {
    return cleaned;
  }
  
  return null;
}

/**
 * Valida se o telefone é válido para WhatsApp
 */
export function isValidWhatsappPhone(phone: string | null | undefined): boolean {
  return formatPhoneForWhatsapp(phone) !== null;
}

/**
 * Interface para dados de exportação WhatsApp
 */
export interface WhatsappExportData {
  nome: string;
  telefone: string;
  telefone_original?: string;
  status_telefone: 'valido' | 'invalido';
}

/**
 * Prepara os dados para exportação, formatando telefones
 */
export function prepareWhatsappExportData(
  data: Array<{ name: string; phone: string | null }>
): WhatsappExportData[] {
  return data.map(item => {
    const formattedPhone = formatPhoneForWhatsapp(item.phone);
    
    return {
      nome: item.name?.trim() || 'Sem nome',
      telefone: formattedPhone || '',
      telefone_original: item.phone || '',
      status_telefone: formattedPhone ? 'valido' : 'invalido',
    };
  });
}

/**
 * Converte array de objetos para CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';
  
  // Header
  const header = columns.map(col => `"${col.header}"`).join(',');
  
  // Rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      // Escape aspas duplas e envolve em aspas
      const stringValue = String(value ?? '').replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Faz download de um arquivo CSV no navegador
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Adiciona BOM para UTF-8 (Excel precisa disso para caracteres especiais)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados para disparo de WhatsApp
 * @param data - Array com nome e telefone
 * @param filename - Nome do arquivo (sem extensão)
 * @param includeInvalid - Se true, inclui telefones inválidos marcados
 */
export function exportToWhatsappCSV(
  data: Array<{ name: string; phone: string | null }>,
  filename: string = 'disparo_whatsapp',
  includeInvalid: boolean = false
): { total: number; validos: number; invalidos: number } {
  const prepared = prepareWhatsappExportData(data);
  
  // Filtra apenas válidos se não quiser incluir inválidos
  const toExport = includeInvalid 
    ? prepared 
    : prepared.filter(item => item.status_telefone === 'valido');
  
  // Define colunas para exportação
  const columns: { key: keyof WhatsappExportData; header: string }[] = includeInvalid
    ? [
        { key: 'nome', header: 'Nome' },
        { key: 'telefone', header: 'Telefone' },
        { key: 'telefone_original', header: 'Telefone Original' },
        { key: 'status_telefone', header: 'Status' },
      ]
    : [
        { key: 'nome', header: 'Nome' },
        { key: 'telefone', header: 'Telefone' },
      ];
  
  const csv = arrayToCSV(toExport, columns);
  
  // Adiciona timestamp ao nome do arquivo
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `${filename}_${timestamp}.csv`);
  
  return {
    total: prepared.length,
    validos: prepared.filter(p => p.status_telefone === 'valido').length,
    invalidos: prepared.filter(p => p.status_telefone === 'invalido').length,
  };
}
