-- ============================================================
-- Monte a sua Black · banco de dados (Supabase / Postgres)
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.respostas (
  id                   uuid primary key default gen_random_uuid(),
  criado_em            timestamptz not null default now(),

  -- diagnóstico
  nome                 text,
  vende                text,
  tipo_negocio         text,
  carro_chefe          text,
  encostado            text,
  ticket               text,
  meta                 text,
  conversao            text,
  ponto_fraco          text,

  -- contato / qualificação
  instagram            text,
  whatsapp             text,
  pagina_vendas        text,

  -- o que o app entregou
  campanhas_entregues  text[] not null default '{}',

  -- cópia de tudo que foi respondido (se você criar perguntas novas, elas caem aqui)
  respostas            jsonb not null default '{}'::jsonb,
  origem               text,           -- ex.: utm_source=instagram

  -- travas contra lixo / abuso
  constraint nome_tam   check (char_length(coalesce(nome,''))        <= 60),
  constraint vende_tam  check (char_length(coalesce(vende,''))       <= 120),
  constraint carro_tam  check (char_length(coalesce(carro_chefe,'')) <= 120),
  constraint enc_tam    check (char_length(coalesce(encostado,''))   <= 120),
  constraint insta_tam  check (char_length(coalesce(instagram,''))   <= 60),
  constraint whats_tam  check (char_length(coalesce(whatsapp,''))    <= 20),
  constraint json_tam   check (pg_column_size(respostas)             <= 20000)
);

create index if not exists respostas_criado_em_idx on public.respostas (criado_em desc);

-- ------------------------------------------------------------
-- Segurança (RLS)
-- Visitante do site: só pode ENVIAR respostas.
-- Ninguém de fora consegue LER, EDITAR ou APAGAR.
-- Você vê tudo no painel do Supabase (Table Editor > respostas).
-- ------------------------------------------------------------
alter table public.respostas enable row level security;

drop policy if exists "visitante envia respostas" on public.respostas;
create policy "visitante envia respostas"
  on public.respostas
  for insert
  to anon
  with check (true);

-- (sem policy de select/update/delete, de propósito)


-- ============================================================
-- Consultas úteis (cole no SQL Editor quando quiser)
-- ============================================================

-- Últimas respostas
-- select criado_em, nome, vende, tipo_negocio, instagram, whatsapp, pagina_vendas
-- from public.respostas order by criado_em desc limit 50;

-- Leads mais quentes: quem NÃO tem página de vendas
-- select nome, vende, instagram, whatsapp from public.respostas
-- where pagina_vendas = 'Não tenho' order by criado_em desc;

-- Maior ponto fraco do seu público
-- select ponto_fraco, count(*) from public.respostas group by 1 order by 2 desc;

-- Tipos de negócio que mais responderam
-- select tipo_negocio, count(*) from public.respostas group by 1 order by 2 desc;

-- Exportar tudo: Table Editor > respostas > botão "Export" > CSV
