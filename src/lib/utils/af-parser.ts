import { AFItem } from '@/lib/types';

export const parseAFData = (text: string) => {
  const af_number = text.match(/AF\s*[:\-]?\s*(\d{4,})/i)?.[1] ?? 'NÃO IDENTIFICADO';
  const supplier_name = text.match(/fornecedor\s*[:\-]?\s*([^\n]+)/i)?.[1]?.trim() ?? 'Fornecedor não identificado';
  const unit_code = (text.match(/\b(9152|6023)\b/)?.[1] as '9152' | '6023' | undefined) ?? '9152';

  const itemRegex = /(\d+)\s+([A-Za-zÀ-ÿ0-9\s\-\/]+?)\s+(\d+[\.,]?\d*)\s*(un|kg|cx|pc|lt)?\s*(?:R\$\s*)?(\d+[\.,]?\d*)?/gi;
  const items: AFItem[] = [];
  for (const match of text.matchAll(itemRegex)) {
    items.push({
      product_name: match[2].trim(),
      qty: Number(match[3].replace(',', '.')),
      unit: match[4] ?? null,
      price: match[5] ? Number(match[5].replace(',', '.')) : null
    });
    if (items.length >= 50) break;
  }

  return { af_number, supplier_name, unit_code, items };
};
