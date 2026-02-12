# Recebimento Inteligente (AF x NF)

MVP em Next.js 14 (App Router) para fluxo de recebimento com:

- Login via Supabase Auth
- Recebimento de NF por QR/câmera (com fallback manual)
- Importação de AF via PDF/texto e OCR (fallback para imagem/PDF escaneado)
- Confronto AF x NF com persistência de divergências
- Relatórios simples por período/severidade

## Stack

- Next.js 14 + TypeScript + TailwindCSS
- Supabase (`auth`, `database`, `storage`)
- Scanner: `@zxing/browser`
- PDF parse: `pdfjs-dist`
- OCR: `tesseract.js`
- UI feedback: `sonner` (toasts)

---

## 1) Criar projeto no Supabase

1. Crie um projeto em https://supabase.com.
2. Em **Project Settings > API**, copie:
   - `Project URL`
   - `anon public key`

## 2) Rodar SQL (schema + RLS)

No SQL Editor do Supabase, rode seu script SQL (você comentou que irá colar depois).

Estrutura esperada no MVP:

- `profiles(id uuid pk, unit_code text, updated_at timestamptz)`
- `nf_docs(id uuid pk, nf_key text, unit_code text, supplier_name text null, file_url text null, created_by uuid, created_at timestamptz)`
- `af_docs(id uuid pk, af_number text, supplier_name text, unit_code text, raw_text text, source_type text, file_url text null, created_by uuid, created_at timestamptz)`
- `af_items(id uuid pk, af_id uuid fk, product_name text, qty numeric, unit text null, price numeric null, created_by uuid, created_at timestamptz)`
- `divergences(id uuid pk, nf_id uuid fk, af_id uuid fk, type text, severity text, description text, created_by uuid, created_at timestamptz)`

## 3) Criar bucket `docs` + policies

No Supabase Storage:

1. Crie bucket `docs`
2. Recomendação de policy mínima:
   - Usuário autenticado pode `insert/select` em caminhos próprios (`(storage.foldername(name))[1] = auth.uid()::text`)

Para tabelas com RLS habilitado, usar política padrão:

- `using (created_by = auth.uid())`
- `with check (created_by = auth.uid())`

Para `profiles`: `id = auth.uid()`.

## 4) Variáveis de ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY
```

## 5) Rodar local

```bash
npm i
npm run dev
```

Acesse `http://localhost:3000`.

## 6) Push e deploy na Vercel

1. Suba para GitHub
2. Importe o repo na Vercel
3. Configure env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Fluxo de demo

1. Login (`/login`)
2. Primeira entrada: escolher unidade padrão (`/onboarding`)
3. Dashboard (`/app`)
4. Receber NF (`/app/receber`): ativar câmera ou digitar manual
5. Importar AF (`/app/importar-af`): upload + revisão texto + salvar
6. Confrontar (`/app/confrontar` e `/app/confrontar/[nf_id]`): salvar divergências + copiar e-mail
7. Relatórios (`/app/relatorios`)
