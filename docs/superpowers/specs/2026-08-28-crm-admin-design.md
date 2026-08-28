# CRM / Painel Admin Certtidão — Design

Data: 2026-08-28

## Objetivo

Substituir o protótipo anterior (repo `Certtidao/CRM`, Fase 1 com dados
fictícios embutidos no JS, sem Supabase) por um painel novo, do zero,
cobrindo não só o CRM de relacionamento mas a estrutura completa vista
nas referências visuais do usuário (`I:\Meu Drive\Flow\Certtidao\10. CRM`,
4 imagens, 2026-08-13): visão geral, CRM/clientes, marketing, operação,
financeiro, comunicação, analytics e configurações.

Repositório antigo (`Certtidao/CRM`) será apagado e recriado do zero
com esse escopo maior — decisão explícita do usuário, ciente de que isso
descarta a Fase 1 já implementada (6 telas, testes, mockup funcional).

## Decisões de arquitetura

- **Projeto novo, fora do Lovable.** Front-end próprio: Vite + React +
  TypeScript + Tailwind + shadcn/ui + `supabase-js` — mesmo stack que
  `novoappcnd` (app cliente) e `certtidaoadmin` (painel admin atual) já
  usam, então os componentes shadcn e o padrão de código são familiares,
  mesmo não reaproveitando o projeto em si.
- **Repositório GitHub:** `Certtidao/CRM` (recriado — apaga o atual e
  cria um novo no lugar), público (mesma visibilidade do atual).
- **Identidade visual:** replica os tokens reais da marca Certtidão
  (extraídos do código de `novoappcnd`/`certtidaoadmin`, não inventados):
  - Sidebar navy `#02142F`, azul primário `#1D4ED8`, verde de destaque
    `#7ED957`
  - Área de conteúdo: tema shadcn neutro claro já usado no admin atual
    (`oklch` zinc/slate), `radius: 0.625rem`, cards com borda simples
  - Padrões de componente do `certtidaoadmin` (Table, Badge
    outline/destructive/secondary, Button variants) — não reinventar
- **Banco: schema `crm` isolado, dados fictícios.** Mesmo projeto
  Supabase "Certtidao" (`erjcmyddtmnwtcexykga`), mas um schema novo e
  separado do `public` (produção real). RLS habilitado só no schema
  `crm`; nada do `public` é lido, escrito ou alterado. Dados de
  clientes/negócios/interações são gerados por seed fictício mas
  realista (nomes, segmentos, tipos de certidão coerentes com o
  catálogo real) — **não são dados de clientes reais**.
- **Autenticação:** login Google restrito a `equipe_interna` (mesmo
  padrão do `certtidaoadmin` / `is_staff_certtidao()`), já que é
  ferramenta interna e o repo/app são públicos. Decisão confirmada com
  o usuário (2026-08-28) — supera o "sem login" do spec da Fase 1
  anterior.
- **Deploy: GitHub Pages, direto do repo `Certtidao/CRM`.** App 100%
  front-end (fala com Supabase direto do navegador, sem servidor
  próprio) — GitHub Action builda e publica a cada push na branch
  principal. Fica no ar em `https://certtidao.github.io/CRM/` (domínio
  próprio pode vir depois). Dois detalhes técnicos:
  - Roteamento client-side precisa do truque padrão de SPA fallback em
    GitHub Pages (`404.html` redirecionando pro `index.html`), senão
    recarregar uma rota tipo `/clientes` direto dá 404.
  - A `anon key` do Supabase fica embutida no bundle publicado — normal
    e seguro (é uma chave pública por design, protegida por RLS), e sem
    risco real aqui já que o schema `crm` só tem dados fictícios.

## Escopo: telas

Consolidando as 4 imagens (as versões 1-3 mostravam um painel amplo; a
4 reorganiza em torno de "CRM") em uma IA só, sem tela duplicada:

1. **Dashboard** — métricas gerais, funil de conversão, "o que precisa
   da minha atenção", gráfico de emissões
2. **CRM / Clientes** — uma tela, dois modos de visualização (toggle
   lista ⇄ kanban por estágio: Leads / Ativados / Em Risco / Inativos)
3. **Cliente / Perfil completo** — abas: Resumo, Emissões (de
   `access_logs`), Financeiro (saldo/plano fictícios do próprio
   `crm.contacts` — não é a tela Financeiro completa, essa é Fase B),
   Marketing/Origem (campo `origem` de `crm.contacts`), Timeline
   (`crm.interacoes`)
4. **Marketing / Aquisição** — origem de cadastro, funil, por campanha
5. **Marketing / Gerador de UTM**
6. **Operação / Certidões emitidas**
7. **Operação / Certidões manuais pendentes**
8. **Financeiro / Visão geral** (saldo, consumo, receita, movimentações)
9. **Financeiro / Indicações e Cupons**
10. **Financeiro / Saldo e Planos** (por cliente)
11. **Financeiro / Saque** (honorários/Pix)
12. **Comunicação / WhatsApp e E-mail**
13. **Analytics / Relatórios** (crescimento, receita por tipo de certidão)
14. **Configurações** (planos, usuários internos, permissões, integrações)

**Risco de escopo, sinalizado aqui de propósito:** as telas 6, 7, 9, 10,
11 replicam funcionalidade que **já existe e já funciona** hoje no
`certtidaoadmin` (Certidões, Fila de Emissão Manual, Cupons, Saques
Pix), ligada a dados reais. Neste projeto novo elas nascem com dados
fictícios do schema `crm` — não substituem o admin atual.

**Faseamento confirmado com o usuário (2026-08-28):**
- **Fase A (escopo deste ciclo de implementação):** telas 1, 2, 3 —
  Dashboard, CRM/Clientes (lista ⇄ kanban), Cliente/Perfil completo.
  É o que é genuinamente novo — o core do CRM de relacionamento.
- **Fase B (próximo ciclo, spec/plano à parte):** as 11 telas
  restantes (Marketing×2, Operação×2, Financeiro×4, Comunicação,
  Analytics, Configurações).

## Modelo de dados (schema `crm`)

Cobre só a Fase A (o que as telas 1, 2 e 3 precisam). A Fase B traz
tabelas próprias (cupons, saques, UTM etc.) quando for especificada.

Baseado no desenho da Fase 1 anterior (`contacts`/`deals`/`tasks`/
`access_logs`), estendido com o que fechamos na Parte 1 desta conversa
(responsável comercial, log unificado de interação+tarefa, 3 sinais de
risco):

### `crm.contacts` (organização fictícia)
id, nome, tipo_pessoa (F/J), documento, email, telefone, segmento,
origem, responsavel_comercial (texto livre — nome do "vendedor"
fictício, já que não há `equipe_interna` real ligada ao schema `crm`),
plano_atual (texto — nome do plano fictício, alimenta a aba
Financeiro/Plano do Cliente/Perfil), saldo_atual (numeric, fictício),
ultimo_deposito_em (date, nullable — alimenta o sinal
`saldo_parado_60d`), criado_em

### `crm.contact_users`
id, contact_id, nome, email, papel

### `crm.deals`
id, contact_id, titulo, estagio (`lead`|`ativado`|`em_risco`|
`inativo` — value ajustado pra bater com o board das imagens, era
`novo_lead|qualificando|negociacao|ganho|perdido` na Fase 1 antiga),
valor_estimado, usou_sistema, o_que_usou, contratou, plano_contratado,
criado_em, atualizado_em

### `crm.interacoes` (substitui `tasks` da Fase 1 — tabela única,
registro passado + tarefa futura, decisão já tomada na Parte 1)
id, contact_id, deal_id (nullable), autor, canal (whatsapp|ligacao|
email|reuniao|outro), nota, status (pendente|concluido),
data_referencia, concluido_em, criado_em

### `crm.access_logs`
id, contact_id, contact_user_id, ip, data_hora, acao — base dos 3
sinais de risco e do Relatório de Acesso

### Sinais de risco (calculados, não persistidos — mesma regra da
Parte 1, adaptada pros dados fictícios do schema `crm`)
sem_pedido_30d, saldo_parado_60d, queda_consumo_50pct →
nivel_risco = saudável (0) / atenção (1) / risco (2-3 sinais)

## Fora de escopo (por ora)

- Ler ou escrever no schema `public` (produção real) — fica pra uma
  Fase 3 futura, só com aprovação explícita, espelhando o que o spec
  anterior já previa.
- Reconstruir de fato Certidões/Cupons/Saques Pix com dados reais —
  essas telas nascem com dados fictícios do `crm` nesta fase (ver
  "Risco de escopo" acima).
- Notificações e integrações externas de verdade (WhatsApp/e-mail são
  telas de simulação, sem envio real).

## Testes

Segue o padrão do repo anterior: testes automatizados (`node --test`
ou equivalente Vitest, já que agora há build/TS) para funções puras de
cálculo (sinais de risco, métricas de dashboard, filtros) + validação
manual dos fluxos de tela.
