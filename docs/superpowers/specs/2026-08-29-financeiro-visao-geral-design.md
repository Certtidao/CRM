# Financeiro / Visão Geral

Data: 2026-08-29

## Objetivo

Primeira tela do módulo Financeiro (Fase B) — visão consolidada e
**da plataforma inteira** (não por cliente): quanto entrou, quanto saiu,
saldo total, e um histórico recente de movimentações. Nova rota
`/financeiro`, novo item no menu lateral (hoje só tem Dashboard e
Clientes).

Escolhido como primeira tela de Financeiro/Operação (que ainda tem mais
5 telas: Certidões emitidas, Certidões manuais pendentes, Indicações e
Cupons, Saldo e Planos por cliente, Saque — todas ficam para depois,
specs separados).

## Contexto

O schema `crm` hoje não tem nenhum registro de evento financeiro — só
`contacts.saldo_atual`, um valor fictício estático por cliente (sem
histórico de como chegou naquele número). Esta tela precisa de eventos
com data, então adiciona uma tabela nova.

## Modelo de dados novo

### `crm.contacts` — 2 colunas novas
- `saldo_operacional numeric(12,2) not null default 0` — mesmo padrão
  de `saldo_atual` (valor fictício estático, seedado independentemente,
  não derivado de eventos). Representa o "Saldo Operacional" que a
  imagem de referência mostra como card separado do "Saldo Certidão".
- `ciclo_faturamento text check (ciclo_faturamento in ('mensal','anual'))`
  — nullable (só preenchido pra contatos que têm `plano_atual`; leads
  sem plano ficam `null`).

**Nota importante, pra não gerar expectativa errada:** `saldo_atual` e
`saldo_operacional` continuam sendo valores fictícios fixos por cliente,
não reconciliados matematicamente com a tabela de movimentações abaixo
— são dois conjuntos de dados fictícios seedados separadamente, coerentes
o suficiente pra parecer real, mas não uma contabilidade de verdade.

### `crm.movimentacoes_financeiras` (tabela nova)
| campo | tipo | notas |
|---|---|---|
| id | uuid | |
| contact_id | uuid | fk → contacts, nullable (`on delete set null`) |
| tipo | text | `'deposito' \| 'consumo' \| 'saque'` |
| descricao | text | livre, ex: "Recarga via Pix", "Emissão de 3 certidões" |
| valor | numeric(12,2) | positivo = entrada (depósito), negativo = saída (consumo/saque) |
| saldo_apos | numeric(12,2) | saldo total da plataforma logo após esse evento (calculado no seed, não em runtime) |
| criado_em | timestamptz | |

RLS/grants seguem o mesmo padrão staff-only das outras tabelas do
schema `crm` (`is_staff_certtidao()`).

**Seed:** ~25-30 registros fictícios espalhados nos últimos 360 dias
(pra dar conteúdo real aos 3 períodos do seletor), com mix de tipos e
valores plausíveis.

## Tela

- **Seletor de período** no topo: `30 dias | 180 dias | 360 dias`
  (mesmo padrão visual das imagens de referência). Controla só os 3
  cards de fluxo abaixo — os cards de saldo total e a contagem de
  planos são "foto do momento", não mudam com o período. A tabela de
  movimentações recentes mostra sempre as últimas ~10, independente do
  período selecionado (é atividade recente, não um relatório do
  período).

- **6 cards de resumo:**
  1. Receita líquida (no período) — soma dos `valor` positivos
     (`tipo = 'deposito'`)
  2. Consumo (no período) — soma absoluta dos `valor` negativos onde
     `tipo = 'consumo'`
  3. Saldo Certidão total — soma de `contacts.saldo_atual` (todos os
     clientes)
  4. Saldo Operacional total — soma de `contacts.saldo_operacional`
  5. Saques (no período) — soma absoluta dos `valor` negativos onde
     `tipo = 'saque'`
  6. Planos por ciclo — contagem de contatos com `ciclo_faturamento =
     'mensal'` vs `'anual'` (ex: "18 mensais / 5 anuais"), ignorando
     quem não tem plano

- **Tabela "Movimentações recentes":** últimas ~10 linhas de
  `movimentacoes_financeiras`, ordenadas por `criado_em desc` — colunas
  Data, Tipo, Descrição, Entrada, Saída, Saldo (da plataforma).

## Fora de escopo

- Gráfico de evolução de receita (decidido explicitamente fora, exigiria
  biblioteca de gráficos nova).
- As outras 5 telas de Financeiro/Operação (specs separados).
- Qualquer edição/criação manual de movimentação pela tela — só leitura
  nesta primeira versão.
- Reconciliação real entre `saldo_atual`/`saldo_operacional` e a soma
  das movimentações (ver nota acima).

## Testes

Sem lógica pura complexa além de somas/contagens simples — se a agregação
por tipo/período crescer em complexidade poderá justificar uma função
pura testável (`calcularResumoFinanceiro`), mas nesta primeira versão a
soma é direta o suficiente pra fazer na própria query/render, seguindo o
padrão já usado no Dashboard (`calcularMetricasDashboard` foi separado
por ser mais complexo; aqui não há motivo equivalente ainda). Verificação
manual: trocar o período e confirmar que os 3 cards de fluxo mudam,
enquanto os outros 3 cards e a tabela de movimentações não mudam.
