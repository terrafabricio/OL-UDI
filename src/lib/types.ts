export type UnitCode = '9152' | '6023';

export type Severity = 'critical' | 'warning';

export interface NFDoc {
  id: string;
  nf_key: string;
  unit_code: UnitCode;
  supplier_name?: string | null;
  file_url?: string | null;
  created_at: string;
}

export interface AFItem {
  product_name: string;
  qty: number;
  unit?: string | null;
  price?: number | null;
}

export interface AFDoc {
  id: string;
  af_number: string;
  supplier_name: string;
  unit_code: UnitCode;
  raw_text: string;
  source_type: 'pdf_text' | 'pdf_ocr' | 'photo_ocr';
  file_url?: string | null;
  created_at: string;
  items?: AFItem[];
}
