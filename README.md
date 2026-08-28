# CRM / Painel Admin — Certtidão

Front-end (Vite + React + TypeScript + Tailwind, com shadcn/ui configurado
como dependência/tooling para uso futuro), conectado ao schema `crm`
(isolado, dados fictícios) do projeto Supabase real da Certtidão. Ver
`docs/superpowers/specs/2026-08-28-crm-admin-design.md`.

## Pré-requisitos

Antes de rodar localmente ou fazer deploy, confirme o seguinte:

1. **Schema `crm` exposto na Data API do Supabase.** Em Project Settings →
   API → Data API → Exposed schemas, adicione `crm`. Sem isso, toda tela
   fica presa em "Carregando…" (ou, após o tratamento de erro, exibe uma
   mensagem de falha ao carregar).
2. **Migrations em outro repositório.** As migrations do schema `crm`
   vivem no repositório `Certtidao/supabase`, não neste repositório.
3. **Conta precisa estar em `equipe_interna`.** Login com Google válido
   não é suficiente — a conta autenticada precisa ser membro de
   `public.equipe_interna` no banco do Supabase para ter acesso ao painel.
4. **Redirect URIs do Google OAuth.** No provedor Google configurado no
   Supabase Auth, as Redirect URIs precisam incluir
   `https://certtidao.github.io/CRM/` e `http://localhost:5173/CRM/`.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencher com as chaves reais
npm run dev
```

## Testes

```bash
npm test
# ou, equivalente:
npx vitest run
```

## Deploy

Automático via GitHub Actions a cada push em `main`, publicado em
https://certtidao.github.io/CRM/.

## Fase A (este repositório, no estado atual)

Dashboard, CRM/Clientes (lista ⇄ kanban) e Cliente/Perfil completo.
Marketing, Operação, Financeiro, Comunicação, Analytics e Configurações
ficam para a Fase B — ver o spec.
