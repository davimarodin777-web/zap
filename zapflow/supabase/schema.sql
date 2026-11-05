create extension if not exists pgcrypto;

create table if not exists public.contatos (
  id uuid primary key default gen_random_uuid(),
  phone_number_id text not null,
  wa_id text not null,
  nome text,
  primeira_msg_em timestamptz not null default now(),
  ultima_msg timestamptz not null default now(),
  total_mensagens integer not null default 0,
  unique (phone_number_id, wa_id)
);

create table if not exists public.automacoes (
  id uuid primary key default gen_random_uuid(),
  palavra_chave text not null,
  resposta text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  contato_id uuid not null references public.contatos(id) on delete cascade,
  wa_message_id text unique,
  direcao text not null check (direcao in ('entrada', 'saida')),
  conteudo text not null,
  criado_em timestamptz not null default now()
);

create index if not exists mensagens_contato_idx on public.mensagens(contato_id);
create index if not exists automacoes_ativas_idx on public.automacoes(ativo);

-- As rotas de servidor usam a Service Role Key, que ignora RLS.
-- Não exponha essa chave no navegador.
alter table public.contatos enable row level security;
alter table public.automacoes enable row level security;
alter table public.mensagens enable row level security;
