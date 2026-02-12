import { AFDoc, AFItem, NFDoc, Severity } from '@/lib/types';
import { normalizeText } from './format';

export interface Divergence {
  type: string;
  severity: Severity;
  description: string;
}

const matchItem = (afItem: AFItem, nfItems: AFItem[]) => {
  const normalized = normalizeText(afItem.product_name);
  return nfItems.find((item) => {
    const target = normalizeText(item.product_name);
    return target.includes(normalized) || normalized.includes(target);
  });
};

export const compareDocs = (nf: NFDoc, af: AFDoc, nfItems: AFItem[] = []) => {
  const divergences: Divergence[] = [];

  if (af.unit_code !== nf.unit_code) {
    divergences.push({ type: 'unit_code', severity: 'critical', description: `Unidade divergente: AF ${af.unit_code} x NF ${nf.unit_code}.` });
  }

  if (nf.supplier_name && normalizeText(nf.supplier_name) !== normalizeText(af.supplier_name)) {
    divergences.push({ type: 'supplier_name', severity: 'critical', description: 'Fornecedor divergente entre AF e NF.' });
  }

  af.items?.forEach((item) => {
    const match = matchItem(item, nfItems);
    if (!match) {
      divergences.push({ type: 'item_missing', severity: 'critical', description: `Item ausente na NF: ${item.product_name}.` });
      return;
    }

    if (item.qty !== match.qty) {
      divergences.push({
        type: 'qty_diff',
        severity: 'critical',
        description: `Quantidade divergente para ${item.product_name}: AF ${item.qty} x NF ${match.qty}.`
      });
    }
  });

  return divergences;
};

export const buildAdjustmentEmail = ({ unit, supplier, af, nf, divergences }: { unit: string; supplier: string; af: string; nf: string; divergences: string[] }) => {
  return `Assunto: Ajuste necessário - Divergências AF x NF\n\nPrezados,\n\nIdentificamos divergências no recebimento da unidade ${unit}.\n\nFornecedor: ${supplier}\nAF: ${af}\nNF: ${nf}\n\nDivergências encontradas:\n${divergences.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nSolicitamos verificação e ajuste dos pontos acima.\n\nAtenciosamente,\nEquipe de Recebimento`;
};
