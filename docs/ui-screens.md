# BriefAI - Especificacao de Telas (UI/UX)

Paleta: neutra (branco, cinzas, azul leve). Tipografia moderna. Animacoes leves (fade/slide). Layout responsivo desktop/tablet/mobile. Contexto SaaS multi-tenant: super admin, tenant admin, arquiteto, cliente.

## 1) Autenticacao
- Login: email/senha, botao Google. Link "Esqueci a senha". Seletor de idioma (pt-BR default, en, es).
- Cadastro (tenant): nome, email, senha, confirmacao, role (Tenant Admin). Opcao de criar tenant (nome + slug); planos listados (Starter/Pro).
- Reset: inserir email, confirmar codigo, definir nova senha.

## 2) Dashboard Super Admin
- Header: logo super admin, seletor de idioma, avatar.
- Cards KPI: tenants ativos/pausados, uso de tokens IA, armazenamento total, PDF exports.
- Tabela de tenants: nome, slug, plano, status (badge), uso (briefings, ai tokens, storage), ultima atividade, acoes (Ver, Pausar/Reativar, Ajustar limites).
- Filtro/busca por nome/slug/status/plano. Botao "Criar tenant".

## 3) Detalhe do Tenant (Super Admin)
- Header com nome/slug/plano/status.
- Abas: Visao Geral (uso mensal, limites), Usuarios/Memberships, Planos e Limites, Audit Log.
- Acoes: Pausar/Reativar, Mudar Plano, Ajustar limites, Regenerar link de convite.

## 4) Dashboard Tenant (Admin/Arquiteto)
- Header: logo tenant, seletor de idioma, avatar menu (perfil/sair).
- Cards: "Criar template", "Meus briefings", "Biblioteca de imagens".
- Lista de briefings: nome, cliente, status, progresso, ultima atualizacao, botao "Copiar link".
- Filtro/Busca por cliente/status.

## 5) Builder de Briefing
- Layout 2 colunas (desktop): esquerda estrutura (arvore de secoes), direita canvas de edicao.
- Acoes: adicionar secao, adicionar pergunta (texto, multipla escolha, slider, upload, escolha por imagem), drag-and-drop para reordenar.
- Propriedades da pergunta: label, descricao, obrigatoriedade, opcoes (com imagem/legenda), limites do slider.
- Salvamento: auto-save, "Salvar como template", "Duplicar".
- Preview: modal que mostra fluxo tipo Typeform.

## 6) Fluxo Cliente (Typeform/chat)
- Uma pergunta por vez, barra de progresso, indicador de secao.
- Controles: texto, multipla escolha (chips/cards), slider, upload, escolha por imagem (cards com legenda), booleano.
- Acoes: voltar, continuar, "Salvar e continuar depois".
- Estado de rede: loading entre passos, toasts de salvamento.

## 7) IA
- Painel lateral (collapsible) no builder/briefing: cards de "Sugestoes de perguntas", "Resumo", "Inconsistencias".
- Botao "Aplicar sugestao" para injetar pergunta no template/fluxo.
- Log de IA por briefing (lista cronologica).

## 8) Exportacoes
- Tela/modal de exportar: opcoes PDF completo, PDF resumido, JSON, ZIP de imagens.
- Indicador de processamento async; entrega via link de download.

## 9) Biblioteca de Imagens
- Grid responsivo com cards (thumb, legenda, dono). Filtros por tag/busca.
- Upload: dropzone, preview, metadata (estilo, ambiente, material).
- Acao "Inserir no template" em modo builder.

## 10) Configuracoes
- Perfil: nome, email, idioma preferido.
- Preferencias: default de IA (provider/modelo), limites de sugestoes.
- Time: convites para membros (tenant admin cria; roles: tenant_admin, architect, client).
- Billing/Uso (tenant admin): plano atual, limites, consumo (briefings, tokens IA, storage, pdf exports), botao "Falar com suporte".

## 11) Audit Log (tenant e super admin)
- Lista cronologica: data, ator, acao, alvo, detalhes (metadata), filtros por ator/acao/periodo.

## 12) Responsividade
- Mobile: fluxo cliente em tela cheia; builder usa colapsar lista de secoes; dashboard vira listas empilhadas; tabelas viram cards.

## 13) Componentes chave
- Stepper de progresso; chips; cards de imagem; slider com label numerico; modal; toasts; skeletons para loading; badges de status (active/paused), tabela responsiva com colunas colapsaveis.
