export type UnitCode = '9152' | '6023';

export type Severity = 'critical' | 'warning';

export interface Profile {
  id: string;
  unit_code: UnitCode | null;
  role?: 'receiver' | string;
}

export interface NFDoc {
  id: string;
  nf_key: string;
  unit_code: UnitCode;
  supplier_name?: string | null;
  file_path?: string | null;
  created_by: string;
  created_at: string;
}

export interface NFItem {
  id?: string;
  nf_id?: string;
  product_name: string;
  qty: number;
  unit?: string | null;
  price?: number | null;
}

export interface AFItem {
  id?: string;
  af_id?: string;
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
  source_type: 'pdf_text' | 'pdf_ocr' | 'photo_ocr' | 'manual';
  file_path?: string | null;
  created_by: string;
  created_at: string;
}

export interface Divergence {
  type: string;
  severity: Severity;
  description: string;
}
