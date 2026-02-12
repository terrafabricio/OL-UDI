'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { parseAFData } from '@/lib/utils/af-parser';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function ImportarAFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [sourceType, setSourceType] = useState<'pdf_text' | 'pdf_ocr' | 'photo_ocr' | 'manual'>('manual');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const runOcr = async (image: HTMLCanvasElement | File) => {
    const worker = await createWorker('por');
    const { data } = await worker.recognize(image);
    await worker.terminate();
    return data.text;
  };

  const extractFromPdf = async (f: File) => {
    const data = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const extracted = content.items.map((item: { str?: string }) => item.str || '').join(' ').trim();
    if (extracted.length > 80) {
      setSourceType('pdf_text');
      return extracted;
    }

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx!, viewport }).promise;
    const ocrText = await runOcr(canvas);
    setSourceType('pdf_ocr');
    return ocrText;
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setText('');
    setOcrWarning(null);
    if (!f) return;

    isCancelledRef.current = false;
    setExtracting(true);

    try {
      let extracted = '';
      if (f.type === 'application/pdf') {
        extracted = await extractFromPdf(f);
      } else {
        setSourceType('photo_ocr');
        extracted = await runOcr(f);
      }

      if (!isCancelledRef.current) {
        setText(extracted);
        if (!extracted.trim()) {
          setOcrWarning('Não conseguimos extrair texto automaticamente. Você pode revisar manualmente antes de salvar.');
        }
      }
    } catch {
      setSourceType('manual');
      setOcrWarning('Falha na extração (PDF/OCR). Você ainda pode salvar com revisão manual.');
    } finally {
      setExtracting(false);
    }
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecione um arquivo de AF para continuar.');
      return;
    }

    const parsed = parseAFData(text);
    if (!parsed.af_number && !text.trim()) {
      toast.error('Informe pelo menos um identificador da AF ou algum texto revisado.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setSaving(false);
      return;
    }

    const filePath = `${user.id}/af/${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from('docs').upload(filePath, file, { upsert: true });
    if (upload.error) {
      toast.error('Falha no upload do arquivo original da AF.');
      setSaving(false);
      return;
    }

    const { data: af, error } = await supabase
      .from('af_docs')
      .insert({
        af_number: parsed.af_number || 'NÃO IDENTIFICADO',
        supplier_name: parsed.supplier_name || 'Fornecedor não identificado',
        unit_code: parsed.unit_code,
        raw_text: text,
        source_type: sourceType,
        file_path: filePath,
        created_by: user.id
      })
      .select('id')
      .single();

    if (error || !af) {
      toast.error(error?.message ?? 'Falha ao salvar AF');
      setSaving(false);
      return;
    }

    if (parsed.items.length) {
      const { error: itemError } = await supabase.from('af_items').insert(parsed.items.map((it) => ({ ...it, af_id: af.id, created_by: user.id })));
      if (itemError) toast.error('AF salva, mas houve erro ao gravar parte dos itens.');
    }

    toast.success('AF importada com sucesso.');
    setSaving(false);
    setText('');
    setFile(null);
    setOcrWarning(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Importar AF</h2>
      <Card className="space-y-4">
        <input type="file" accept="application/pdf,image/*" onChange={onFile} />
        {extracting ? <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Extraindo texto... este processo pode levar alguns segundos.</p> : null}
        {extracting ? (
          <Button variant="secondary" type="button" onClick={() => (isCancelledRef.current = true)}>
            Cancelar leitura
          </Button>
        ) : null}
        {ocrWarning ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{ocrWarning}</p> : null}

        <form onSubmit={onSave} className="space-y-3">
          <label className="text-sm font-medium">Revisar texto extraído</label>
          <textarea
            className="min-h-72 w-full rounded-lg border border-slate-300 p-3 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O texto extraído aparecerá aqui para revisão..."
          />
          <Button disabled={saving}>{saving ? 'Salvando...' : 'Salvar AF e itens'}</Button>
        </form>
      </Card>
    </div>
  );
}
