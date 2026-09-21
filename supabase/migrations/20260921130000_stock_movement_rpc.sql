-- Stock movements become the single, atomic source of truth for entrada/ajuste.
--
-- Before: the client wrote the product stock and the movement in two separate calls
-- (partial writes, stale-stock math), and adjustments never reached the database.

-- Name snapshot: the UI shows it, and history must survive renames/deletes.
alter table public.movimientos_stock add column producto_nombre text;

update public.movimientos_stock m
   set producto_nombre = p.nombre
  from public.productos p
 where p.id = m.producto_id;

-- p_cantidad meaning depends on the type:
--   entrada -> units added (> 0)
--   ajuste  -> the counted real stock (>= 0); the difference is computed here, under
--              a row lock, so two devices adjusting at once cannot overwrite each other.
-- Returns {movimiento: <row>, stock: <new stock>}.
create function public.registrar_movimiento_stock(
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
