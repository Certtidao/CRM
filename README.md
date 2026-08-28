# CRM / Painel Admin — Certtidão

Front-end (Vite + React + TypeScript + Tailwind + shadcn/ui), conectado
ao schema `crm` (isolado, dados fictícios) do projeto Supabase real da
Certtidão. Ver `docs/superpowers/specs/2026-08-28-crm-admin-design.md`.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencher com as chaves reais
npm run dev
```

## Testes

```bash
npx vitest run
```

## Deploy

Automático via GitHub Actions a cada push em `main`, publicado em
https://certtidao.github.io/CRM/.

## Fase A (este repositório, no estado atual)

Dashboard, CRM/Clientes (lista ⇄ kanban) e Cliente/Perfil completo.
Marketing, Operação, Financeiro, Comunicação, Analytics e Configurações
ficam para a Fase B — ver o spec.
