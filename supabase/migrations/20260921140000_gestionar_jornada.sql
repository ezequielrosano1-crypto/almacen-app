-- Captures gestionar_jornada() as it already exists in production (created directly
-- on the dashboard, never versioned). Auto-closes jornadas left open from previous
-- days and opens today's jornada within business hours; manual closes are protected
-- because it never touches a jornada that already exists for today.
create or replace function public.gestionar_jornada()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ahora_uy timestamp;
  fecha_uy date;
  hora_uy time;
  jornada_hoy public.jornada%rowtype;
begin
  ahora_uy := now() at time zone 'America/Montevideo';
  fecha_uy := ahora_uy::date;
  hora_uy := ahora_uy::time;

  -- Cerrar jornadas anteriores que hayan quedado abiertas.
  update public.jornada
  set
    estado = 'CERRADA',
    hora_cierre = '22:00:00',
    cerrado_automatico = true,
    updated_at = now()
  where negocio_id = 1
    and fecha < fecha_uy
    and estado = 'ABIERTA';

  -- Buscar la jornada de hoy.
  select *
  into jornada_hoy
  from public.jornada
  where negocio_id = 1
    and fecha = fecha_uy
  limit 1;

  -- Si ya existe una jornada de hoy, NO crear ni reabrir otra.
  -- Esto protege los cierres manuales.
  if jornada_hoy.id is not null then
    if hora_uy >= time '22:00:00'
       and jornada_hoy.estado = 'ABIERTA' then

      update public.jornada
      set
        estado = 'CERRADA',
        hora_cierre = '22:00:00',
        cerrado_automatico = true,
        updated_at = now()
      where id = jornada_hoy.id
        and negocio_id = 1;
    end if;

    return;
  end if;

  -- Si estamos dentro del horario, crear la jornada del día.
  if hora_uy >= time '08:00:00'
     and hora_uy < time '22:00:00' then

    insert into public.jornada (
      id,
      negocio_id,
      fecha,
      estado,
      hora_apertura,
      hora_cierre,
      cerrado_automatico,
      total,
      cantidad_ventas,
      created_at,
      updated_at
    )
    values (
      'caja-' || fecha_uy::text,
      1,
      fecha_uy,
      'ABIERTA',
      hora_uy,
      null,
      false,
      0,
      0,
      now(),
      now()
    );

  end if;
end;
$$;

grant execute on function public.gestionar_jornada() to anon, authenticated, service_role;
