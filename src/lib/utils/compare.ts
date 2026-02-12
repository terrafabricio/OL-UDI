import { AFDoc, AFItem, Divergence, NFDoc, Severity } from '@/lib/types';
import { normalizeText } from './format';

const tokenize = (name: string) => normalizeText(name).split(/\s+/).filter((token) => token.length > 2);

const scoreMatch = (a: string, b: string) => {
  const na = normalizeText(a);
  const nb = normalizeText(b);

  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 80;

  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  const common = aTokens.filter((token) => bTokens.includes(token));
  return common.length * 10;
};

const findBestItemMatch = (afItem: AFItem, nfItems: AFItem[]) => {
  let best: AFItem | null = null;
  let bestScore = 0;

  for (const candidate of nfItems) {
    const score = scoreMatch(afItem.product_name, candidate.product_name);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return bestScore >= 20 ? best : null;
};

const severityFromQtyDiff = (afQty: number, nfQty: number): Severity => {
  const diff = Math.abs(afQty - nfQty);
  return diff <= 1 ? 'warning' : 'critical';
};

export const compareDocs = (nf: NFDoc, af: AFDoc, nfItems: AFItem[] = [], afItems: AFItem[] = []) => {
  const divergences: Divergence[] = [];

  if (af.unit_code !== nf.unit_code) {
    divergences.push({ type: 'unit_code', severity: 'critical', description: `Unidade divergente: AF ${af.unit_code} x NF ${nf.unit_code}.` });
  }

  if (nf.supplier_name && normalizeText(nf.supplier_name) !== normalizeText(af.supplier_name)) {
    divergences.push({ type: 'supplier_name', severity: 'critical', description: `Fornecedor divergente: AF ${af.supplier_name} x NF ${nf.supplier_name}.` });
  }

  const matchedNFProducts = new Set<string>();

  afItems.forEach((item) => {
    const match = findBestItemMatch(item, nfItems);
    if (!match) {
      divergences.push({ type: 'item_missing', severity: 'critical', description: `Item da AF ausente na NF: ${item.product_name}.` });
      return;
    }

    matchedNFProducts.add(match.product_name);

    if (Number(item.qty) !== Number(match.qty)) {
      divergences.push({
        type: 'qty_diff',
        severity: severityFromQtyDiff(Number(item.qty), Number(match.qty)),
        description: `Quantidade divergente em ${item.product_name}: AF ${item.qty} x NF ${match.qty}.`
      });
    }
  });

  nfItems.forEach((nfItem) => {
    if (!matchedNFProducts.has(nfItem.product_name)) {
      divergences.push({ type: 'item_extra', severity: 'critical', description: `Item extra na NF: ${nfItem.product_name}.` });
    }
  });

  return divergences;
};

export const buildAdjustmentEmail = ({
  unit,
  supplier,
  af,
  nf,
  divergences,
  attachments
}: {
  unit: string;
  supplier: string;
  af: string;
  nf: string;
  divergences: string[];
  attachments?: string[];
}) => {
  const attachmentsText = attachments?.length ? attachments.map((a) => `- ${a}`).join('\n') : '- Sem anexos disponíveis no momento';

  return `Assunto: Ajuste necessário - Divergências AF x NF\n\nPrezados,\n\nNo recebimento da unidade ${unit}, identificamos divergências entre os documentos abaixo:\n\nFornecedor: ${supplier}\nAF: ${af}\nNF: ${nf}\n\nDivergências encontradas:\n${divergences.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nAnexos/Referências:\n${attachmentsText}\n\nSolicitamos verificação e ajuste dos pontos listados para seguirmos com a regularização do recebimento.\n\nAtenciosamente,\nEquipe de Recebimento`;
};
