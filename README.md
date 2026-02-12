# Recebimento Inteligente (AF x NF)

MVP demo-ready em **Next.js 14 + Supabase** para:

- autenticação (entrar/criar conta)
- recebimento de NF por câmera (QR) com fallback manual
- importação de AF por PDF/imagem com OCR fallback
- confronto AF x NF com divergências e e-mail de ajuste
- relatórios simples (7/30 dias)

## Pré-requisitos

- Node 18+
- Projeto Supabase já criado
- Tabelas já existentes: `profiles`, `af_docs`, `af_items`, `nf_docs`, `nf_items`, `divergences`
- Bucket de storage: `docs`

## 1) Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

> **Só isso precisa ser preenchido manualmente** (local e Vercel).

## 2) Rodar local

```bash
npm i
npm run dev
```

Aplicação: `http://localhost:3000`

## 3) Build e lint

```bash
npm run lint
npm run build
```

## 4) Deploy na Vercel

1. Conecte o repositório na Vercel
2. Configure as mesmas env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Notas de Supabase (RLS + Storage)

- O app grava `created_by = auth.uid()` em inserts
- Para storage, arquivos são salvos em paths por usuário:
  - `${user.id}/nf/...`
  - `${user.id}/af/...`
- Recomenda-se policy RLS por `created_by = auth.uid()` nas tabelas e pasta do usuário no bucket `docs`

## Fluxo de demo

1. `/login` → criar conta ou entrar
2. `/app` → clicar **Receber NF**
3. `/app/receber` → ativar câmera (ou digitar manual) → salvar NF
4. `/app/importar-af` → upload PDF/foto → revisar texto → salvar AF + itens
5. `/app/confrontar` → abrir uma NF → escolher AF → ver/salvar divergências
6. clicar **Gerar e-mail de ajuste** → copiar template

## Observação importante sobre câmera

Leitura por câmera funciona melhor em **HTTPS** (produção/Vercel). Em HTTP local pode haver limitação de permissão em alguns navegadores.
