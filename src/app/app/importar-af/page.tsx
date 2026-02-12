'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
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
  const [sourceType, setSourceType] = useState<'pdf_text' | 'pdf_ocr' | 'photo_ocr'>('pdf_text');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const extractFromPdf = async (f: File) => {
    const data = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const extracted = content.items.map((item: any) => item.str).join(' ');
    if (extracted.length > 50) {
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

  const runOcr = async (image: HTMLCanvasElement | File) => {
    const worker = await createWorker('por');
    const { data } = await worker.recognize(image);
    await worker.terminate();
    return data.text;
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (!f) return;

    setExtracting(true);
    try {
      if (f.type === 'application/pdf') {
        setText(await extractFromPdf(f));
      } else {
        setSourceType('photo_ocr');
        setText(await runOcr(f));
      }
    } catch {
      toast.error('Falha na extração. Revise manualmente ou tente outro arquivo.');
    }
    setExtracting(false);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const path = `${user.id}/af/${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from('docs').upload(path, file, { upsert: true });
    if (upload.error) {
      toast.error(upload.error.message);
      setSaving(false);
      return;
    }

    const parsed = parseAFData(text);
    const fileUrl = supabase.storage.from('docs').getPublicUrl(path).data.publicUrl;

    const { data: af, error } = await supabase
      .from('af_docs')
      .insert({
        af_number: parsed.af_number,
        supplier_name: parsed.supplier_name,
        unit_code: parsed.unit_code,
        raw_text: text,
        source_type: sourceType,
        file_url: fileUrl,
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
      await supabase.from('af_items').insert(parsed.items.map((it) => ({ ...it, af_id: af.id, created_by: user.id })));
    }

    toast.success('AF importada com sucesso.');
    setSaving(false);
    setText('');
    setFile(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Importar AF</h2>
      <Card className="space-y-4">
        <input type="file" accept="application/pdf,image/*" onChange={onFile} />
        {extracting ? <p className="text-sm text-slate-600">Extraindo texto... aguarde.</p> : null}
        <form onSubmit={onSave} className="space-y-3">
          <label className="text-sm font-medium">Revisar texto extraído</label>
          <textarea
            className="min-h-72 w-full rounded-lg border border-slate-300 p-3 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O texto extraído aparecerá aqui para revisão..."
          />
          <Button disabled={saving || !text}>{saving ? 'Salvando...' : 'Salvar AF e itens'}</Button>
        </form>
      </Card>
    </div>
  );
}
