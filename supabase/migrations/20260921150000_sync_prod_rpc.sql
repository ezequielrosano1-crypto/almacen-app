-- Production's live schema diverged from these migrations (it was built out of band,
-- via dashboard/older history that was never captured here). Its base tables, policies
-- and indexes already exist under different names, but registrar_venta and
-- registrar_movimiento_stock -- the RPCs the current app code calls -- were missing.
-- This migration only adds what's actually missing; it does not touch anything that
-- already works in prod.

alter table public.movimientos_stock add column if not exists producto_nombre text;

update public.movimientos_stock m
   set producto_nombre = p.nombre
  from public.productos p
 where p.id = m.producto_id
   and m.producto_nombre is null;

create or replace function public.registrar_venta(
  p_negocio_id bigint,
  p_jornada_id text,
  p_pago       text,
  p_total      numeric,
  p_items      jsonb
) returns public.ventas
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venta public.ventas;
  v_item  record;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'registrar_venta: the sale needs at least one item';
  end if;

  insert into public.ventas (negocio_id, jornada_id, fecha, total, pago)
  values (p_negocio_id, p_jornada_id, now(), p_total, p_pago)
  returning * into v_venta;

  for v_item in
    select * from jsonb_to_recordset(p_items) as x(
      producto_id bigint, nombre text, cantidad numeric,
      unidad text, precio_unitario numeric, subtotal numeric)
  loop
    insert into public.venta_items
      (venta_id, producto_id, nombre, cantidad, unidad, precio_unitario, subtotal)
    values
      (v_venta.id, v_item.producto_id, v_item.nombre, v_item.cantidad,
       v_item.unidad, v_item.precio_unitario, v_item.subtotal);

    update public.productos
       set stock = stock - v_item.cantidad
     where id = v_item.producto_id and negocio_id = p_negocio_id;

    if not found then
      raise exception 'registrar_venta: product % not found for negocio %',
        v_item.producto_id, p_negocio_id;
    end if;
  end loop;

  return v_venta;
end;
$$;

grant execute on function public.registrar_venta(bigint, text, text, numeric, jsonb)
  to anon, authenticated;

create or replace function public.registrar_movimiento_stock(
  p_negocio_id  bigint,
  p_producto_id bigint,
  p_tipo        text,
  p_cantidad    numeric,
  p_motivo      text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_prod       public.productos;
  v_new_stock  numeric(12, 3);
  v_diferencia numeric(12, 3);
  v_motivo     text;
  v_mov        public.movimientos_stock;
begin
  if p_tipo not in ('entrada', 'ajuste') then
    raise exception 'registrar_movimiento_stock: tipo must be entrada or ajuste, got %', p_tipo;
  end if;

  select * into v_prod
    from public.productos
   where id = p_producto_id and negocio_id = p_negocio_id
     for update;

  if not found then
    raise exception 'registrar_movimiento_stock: product % not found for negocio %',
      p_producto_id, p_negocio_id;
  end if;

  if p_tipo = 'entrada' then
    if p_cantidad is null or p_cantidad <= 0 then
      raise exception 'registrar_movimiento_stock: entrada needs a positive quantity';
    end if;
    v_diferencia := p_cantidad;
    v_new_stock  := v_prod.stock + p_cantidad;
    v_motivo     := coalesce(nullif(btrim(p_motivo), ''), 'Entrada de stock');
  else
    if p_cantidad is null or p_cantidad < 0 then
      raise exception 'registrar_movimiento_stock: ajuste needs a counted stock >= 0';
    end if;
    if p_motivo is null or btrim(p_motivo) = '' then
      raise exception 'registrar_movimiento_stock: ajuste needs a reason';
    end if;
    v_diferencia := p_cantidad - v_prod.stock;
    v_new_stock  := p_cantidad;
    v_motivo     := btrim(p_motivo);
  end if;

  update public.productos set stock = v_new_stock where id = v_prod.id;

  insert into public.movimientos_stock
    (negocio_id, producto_id, producto_nombre, jornada_id, fecha, tipo, cantidad, unidad, diferencia, motivo)
  values
    (p_negocio_id, v_prod.id, v_prod.nombre, null, now(), p_tipo, p_cantidad, v_prod.unidad, v_diferencia, v_motivo)
  returning * into v_mov;

  return jsonb_build_object('movimiento', to_jsonb(v_mov), 'stock', v_new_stock);
end;
$$;

grant execute on function public.registrar_movimiento_stock(bigint, bigint, text, numeric, text)
  to anon, authenticated;
