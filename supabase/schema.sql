-- =====================================================================
-- "Motos con Alejo" - Base de datos en Supabase
-- Se pega COMPLETO en: Supabase > SQL Editor > New query > Run
-- Se puede ejecutar más de una vez sin romper nada.
-- ---------------------------------------------------------------------
-- Idea de seguridad:
--   * Cualquiera puede VER las motos y las reseñas (a través de catalogo()).
--   * Solo el administrador (correo autorizado en es_admin()) crea/edita/borra motos y borra reseñas.
--   * Los visitantes publican reseñas SOLO por crear_resena(), que valida todo
--     y frena el spam. No pueden escribir directo en la tabla.
-- =====================================================================

-- ---------- TABLA DE MOTOS ----------
create table if not exists public.motos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 1 and 80),
  modelo      text not null default '' check (char_length(modelo) <= 20),
  km          text not null default '' check (char_length(km) <= 20),
  precio      text not null default '' check (char_length(precio) <= 20),
  color       text not null default '' check (char_length(color) <= 30),
  descripcion text not null default '' check (char_length(descripcion) <= 600),
  fotos       text[] not null default '{}' check (cardinality(fotos) <= 12),
  video       text not null default '' check (char_length(video) <= 120),
  estado      text not null default 'disponible' check (estado in ('disponible', 'vendido')),
  created_at  timestamptz not null default now()
);

-- ---------- TABLA DE RESEÑAS ----------
create table if not exists public.resenas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (char_length(nombre) between 2 and 40),
  tipo       text not null,
  estrellas  int  not null check (estrellas between 1 and 5),
  texto      text not null check (char_length(texto) between 10 and 500),
  fotos      text[] not null default '{}' check (cardinality(fotos) <= 3),
  huella     text not null default '',      -- huella (hash) de la conexión, solo para frenar spam
  created_at timestamptz not null default now()
);
create index if not exists resenas_huella_idx on public.resenas (huella, created_at desc);
create index if not exists resenas_fecha_idx  on public.resenas (created_at desc);

-- ---------- SEGURIDAD A NIVEL DE FILA (RLS) ----------
-- Solo este correo autenticado tiene permisos de administrador.
-- Además, desactiva "Allow new users to sign up" en Supabase > Authentication > Providers > Email.
create or replace function public.es_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select auth.role() = 'authenticated'
     and lower(coalesce(auth.jwt() ->> 'email', '')) = 'marianabedoya0110@gmail.com';
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

alter table public.motos   enable row level security;
alter table public.resenas enable row level security;

drop policy if exists "motos: ver todos"          on public.motos;
drop policy if exists "motos: admin inserta"      on public.motos;
drop policy if exists "motos: admin actualiza"    on public.motos;
drop policy if exists "motos: admin borra"        on public.motos;
drop policy if exists "resenas: admin ve"         on public.resenas;
drop policy if exists "resenas: admin borra"      on public.resenas;

create policy "motos: ver todos"       on public.motos for select to anon, authenticated using (true);
create policy "motos: admin inserta"   on public.motos for insert to authenticated with check (public.es_admin());
create policy "motos: admin actualiza" on public.motos for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "motos: admin borra"     on public.motos for delete to authenticated using (public.es_admin());

-- Reseñas: el público NO lee ni escribe directo (por eso no tiene políticas). El admin sí ve y borra.
create policy "resenas: admin ve"    on public.resenas for select to authenticated using (public.es_admin());
create policy "resenas: admin borra" on public.resenas for delete to authenticated using (public.es_admin());

-- Permisos de tabla (explícitos, por si el proyecto no los da por defecto)
revoke all on public.motos, public.resenas from anon, authenticated;
grant select on public.motos to anon, authenticated;
grant insert, update, delete on public.motos to authenticated;
grant select, delete on public.resenas to authenticated;

-- ---------- FUNCIÓN: catálogo completo en UNA sola llamada ----------
create or replace function public.catalogo()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'motos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'nombre', m.nombre, 'modelo', m.modelo, 'km', m.km, 'precio', m.precio,
               'color', m.color, 'descripcion', m.descripcion, 'fotos', to_jsonb(m.fotos),
               'video', m.video, 'estado', m.estado) order by m.created_at desc)
      from (select * from public.motos order by created_at desc limit 100) m
    ), '[]'::jsonb),
    'resenas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'nombre', r.nombre, 'tipo', r.tipo, 'estrellas', r.estrellas,
               'texto', r.texto, 'fotos', to_jsonb(r.fotos), 'fecha', r.created_at) order by r.created_at desc)
      from (select * from public.resenas order by created_at desc limit 100) r
    ), '[]'::jsonb)
  );
$$;

-- ---------- FUNCIÓN: publicar una reseña (con validación y anti-spam) ----------
create or replace function public.crear_resena(
  p_nombre text, p_tipo text, p_estrellas int, p_texto text, p_fotos text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre  text := left(btrim(coalesce(p_nombre, '')), 40);
  v_texto   text := left(btrim(coalesce(p_texto, '')), 500);
  v_fotos   text[] := coalesce(p_fotos, '{}');
  v_ip      text;
  v_huella  text;
  f         text;
  c_max_por_hora_y_huella constant int := 5;    -- reseñas por hora desde una misma conexión
  c_max_por_dia_total     constant int := 20;   -- tope de reseñas nuevas por día entre todos
begin
  if char_length(v_nombre) < 2 then raise exception 'Escribe tu nombre.'; end if;
  if p_tipo is null or not (p_tipo = any (array[
       'Compra de una moto', 'Venta de mi moto', 'Trámites', 'Préstamo con prenda', 'Financiación', 'Otro'
     ])) then
    raise exception 'Elige qué vas a reseñar.';
  end if;
  if p_estrellas is null or p_estrellas < 1 or p_estrellas > 5 then
    raise exception 'La calificación debe ser de 1 a 5 estrellas.';
  end if;
  if char_length(v_texto) < 10 then raise exception 'Cuéntanos un poco más (mínimo 10 letras).'; end if;
  if cardinality(v_fotos) > 3 then raise exception 'Máximo 3 fotos.'; end if;
  if p_tipo = 'Compra de una moto' and cardinality(v_fotos) = 0 then
    raise exception 'Para reseñar la compra de una moto necesitas subir al menos una foto.';
  end if;
  foreach f in array v_fotos loop
    -- Solo se aceptan fotos que estén en NUESTRO bucket "fotos", carpeta "resenas"
    if f !~ '^https://[A-Za-z0-9.-]+/storage/v1/object/public/fotos/resenas/[A-Za-z0-9._-]+\.jpg$' then
      raise exception 'Una de las fotos no es válida.';
    end if;
  end loop;

  -- Freno anti-spam: huella de la conexión (no se guarda la IP)
  v_ip := split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', '?'), ',', 1);
  v_huella := md5(v_ip || '|negocios-con-alejo');

  if (select count(*) from public.resenas where huella = v_huella and created_at > now() - interval '1 hour') >= c_max_por_hora_y_huella then
    raise exception 'Enviaste varias reseñas seguidas. Intenta de nuevo más tarde.';
  end if;
  if (select count(*) from public.resenas where created_at > now() - interval '24 hours') >= c_max_por_dia_total then
    raise exception 'Hoy recibimos muchas reseñas. Intenta de nuevo mañana.';
  end if;

  insert into public.resenas (nombre, tipo, estrellas, texto, fotos, huella)
  values (v_nombre, p_tipo, p_estrellas, v_texto, v_fotos, v_huella);
end;
$$;

revoke all on function public.catalogo() from public;
revoke all on function public.crear_resena(text, text, int, text, text[]) from public;
grant execute on function public.catalogo() to anon, authenticated;
grant execute on function public.crear_resena(text, text, int, text, text[]) to anon, authenticated;

-- ---------- FOTOS (Storage) ----------
-- Bucket público "fotos": máx. 400 KB por archivo y solo JPG.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 409600, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 409600, allowed_mime_types = array['image/jpeg'];

drop policy if exists "fotos: visitantes suben a resenas" on storage.objects;
drop policy if exists "fotos: admin sube"                 on storage.objects;
drop policy if exists "fotos: admin ve"                   on storage.objects;
drop policy if exists "fotos: admin borra"                on storage.objects;

-- Los visitantes solo pueden subir a la carpeta resenas/ (para sus reseñas)
create policy "fotos: visitantes suben a resenas" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'resenas');
-- El administrador sube a cualquier carpeta, ve y borra
create policy "fotos: admin sube"  on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and public.es_admin());
create policy "fotos: admin ve"    on storage.objects for select to authenticated using (bucket_id = 'fotos' and public.es_admin());
create policy "fotos: admin borra" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and public.es_admin());
