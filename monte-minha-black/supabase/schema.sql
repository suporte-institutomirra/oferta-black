-- ============================================================
-- Monte a sua Black · Instituto Mirra · banco de dados (Supabase)
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run
-- Pode rodar de novo sem problema (não apaga nada).
-- ============================================================

-- ------------------------------------------------------------
-- 1) COMPRADORES — quem pode entrar no app
--    Preenchida automaticamente pela Kiwify (api/kiwify.js).
--    Ninguém de fora lê esta tabela.
-- ------------------------------------------------------------
create table if not exists public.compradores (
  email          text primary key check (email = lower(email)),
  ativo          boolean not null default true,     -- false = reembolso/chargeback
  status         text,                              -- paid, refunded, chargedback, manual
  pedido_id      text,
  produto        text,
  nome           text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

alter table public.compradores enable row level security;
-- (sem policies de propósito: só o webhook, com a chave secreta, escreve aqui)


-- ------------------------------------------------------------
-- 2) PLANOS — as respostas e o progresso de cada compradora
-- ------------------------------------------------------------
create table if not exists public.planos (
  user_id        uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  dados          jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now(),
  constraint dados_tam check (pg_column_size(dados) <= 60000)
);

alter table public.planos enable row level security;


-- ------------------------------------------------------------
-- 3) FUNÇÕES DE ACESSO
-- ------------------------------------------------------------

-- Usada na tela de login: "esse e-mail comprou?"
create or replace function public.email_tem_acesso(p_email text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.compradores
    where email = lower(trim(p_email)) and ativo
  );
$$;

-- Usada depois do login: "a pessoa logada tem acesso?"
create or replace function public.tem_acesso()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.compradores
    where email = lower(auth.jwt() ->> 'email') and ativo
  );
$$;

revoke all on function public.email_tem_acesso(text) from public;
revoke all on function public.tem_acesso() from public;
grant execute on function public.email_tem_acesso(text) to anon, authenticated;
grant execute on function public.tem_acesso() to authenticated;


-- ------------------------------------------------------------
-- 4) REGRAS: cada compradora só vê e edita o próprio plano,
--    e só enquanto o acesso estiver ativo.
-- ------------------------------------------------------------
drop policy if exists "dona le o plano"     on public.planos;
drop policy if exists "dona cria o plano"   on public.planos;
drop policy if exists "dona edita o plano"  on public.planos;

create policy "dona le o plano" on public.planos
  for select to authenticated
  using (user_id = auth.uid() and public.tem_acesso());

create policy "dona cria o plano" on public.planos
  for insert to authenticated
  with check (user_id = auth.uid() and public.tem_acesso());

create policy "dona edita o plano" on public.planos
  for update to authenticated
  using (user_id = auth.uid() and public.tem_acesso())
  with check (user_id = auth.uid() and public.tem_acesso());


-- ============================================================
-- USO NO DIA A DIA (cole no SQL Editor quando precisar)
-- ============================================================

-- Liberar alguém na mão (cortesia, parceira, teste):
-- insert into public.compradores (email, status) values ('email@exemplo.com', 'manual')
-- on conflict (email) do update set ativo = true, atualizado_em = now();

-- Bloquear alguém na mão:
-- update public.compradores set ativo = false, atualizado_em = now() where email = 'email@exemplo.com';

-- Quantas compradoras e quantas já montaram o plano:
-- select
--   (select count(*) from public.compradores where ativo)       as compradoras_ativas,
--   (select count(*) from public.planos where dados ? 'respostas') as comecaram,
--   (select count(*) from public.planos where (dados->>'concluido')::boolean) as terminaram;

-- O que as compradoras vendem (ótimo para ideias de conteúdo):
-- select dados->'respostas'->>'vende' as vende, dados->'respostas'->>'tipo_negocio' as tipo
-- from public.planos order by atualizado_em desc;
