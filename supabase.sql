-- Tabla para registros de la expo CRYPT-STEG
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

-- Permite insertar registros desde la web pública con la anon key.
-- No permite leer registros desde la página pública.
drop policy if exists "Permitir alta publica de registros" on public.expo_registros;
create policy "Permitir alta publica de registros"
on public.expo_registros
for insert
to anon
with check (true);
