-- Tablas para la expo CRYPT-STEG
-- Ejecutar completo en Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Registro principal de visitantes
create table if not exists public.expo_registros (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  email text not null,
  institucion text,
  rol text,
  conocimiento_asimetrica int,
  conocimiento_simetrica int,
  conocimiento_pqc int,
  conocimiento_esteganografia int,
  interes text,
  quiere_material boolean default false,
  acepta_contacto boolean default false,
  comentarios text
);

alter table public.expo_registros enable row level security;

drop policy if exists "Permitir alta publica de registros" on public.expo_registros;
create policy "Permitir alta publica de registros"
on public.expo_registros
for insert
to anon
with check (true);

-- Permite que el frontend recupere el ID recién creado con insert().select().
drop policy if exists "Permitir lectura publica minima de registros" on public.expo_registros;
create policy "Permitir lectura publica minima de registros"
on public.expo_registros
for select
to anon
using (true);

-- 2) Respuestas a desafíos, vinculadas al registro
create table if not exists public.expo_respuestas_desafios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  registro_id uuid references public.expo_registros(id) on delete cascade,
  desafio text not null,
  respuesta text not null,
  clave text,
  observaciones text,
  user_agent text,
  page_url text
);

create index if not exists idx_expo_respuestas_registro_id
on public.expo_respuestas_desafios(registro_id);

create index if not exists idx_expo_respuestas_desafio
on public.expo_respuestas_desafios(desafio);

alter table public.expo_respuestas_desafios enable row level security;

drop policy if exists "Permitir alta publica de respuestas" on public.expo_respuestas_desafios;
create policy "Permitir alta publica de respuestas"
on public.expo_respuestas_desafios
for insert
to anon
with check (registro_id is not null);

-- Vista cómoda para revisar/exportar respuestas desde Supabase.
create or replace view public.v_expo_respuestas_completas as
select
  r.created_at as fecha_registro,
  r.nombre,
  r.email,
  r.institucion,
  r.rol,
  d.created_at as fecha_respuesta,
  d.desafio,
  d.respuesta,
  d.clave,
  d.observaciones,
  d.registro_id,
  d.id as respuesta_id
from public.expo_respuestas_desafios d
join public.expo_registros r on r.id = d.registro_id
order by d.created_at desc;
