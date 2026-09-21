begin;
select plan(13);

insert into public.productos (id, negocio_id, nombre, precio, unidad, stock, stock_minimo)
values (9101, 1, 'Yerba', 190, 'unidad', 10, 1),
       (9102, 1, 'Manzanas', 80, 'kg', 5, 1);

select has_column('public', 'movimientos_stock', 'producto_nombre', 'movement keeps a product name snapshot');

-- entrada: adds to stock, records movement with name
select is((select (public.registrar_movimiento_stock(1, 9101, 'entrada', 4, null))->>'stock')::numeric, 14.000::numeric, 'entrada returns new stock');
select is((select stock from public.productos where id = 9101), 14.000::numeric, 'entrada updates stock');
select is((select diferencia from public.movimientos_stock where producto_id = 9101 and tipo = 'entrada'), 4.000::numeric, 'entrada diferencia = cantidad');
select is((select producto_nombre from public.movimientos_stock where producto_id = 9101 and tipo = 'entrada'), 'Yerba', 'movement stores product name');

-- ajuste: p_cantidad is the counted real stock, difference is computed on the server
select is((select (public.registrar_movimiento_stock(1, 9102, 'ajuste', 3.5, 'Rotura'))->>'stock')::numeric, 3.500::numeric, 'ajuste sets stock to the counted value');
select is((select diferencia from public.movimientos_stock where producto_id = 9102 and tipo = 'ajuste'), -1.500::numeric, 'ajuste diferencia computed server-side (3.5 - 5)');
select is((select motivo from public.movimientos_stock where producto_id = 9102 and tipo = 'ajuste'), 'Rotura', 'ajuste keeps its reason');

-- failures leave no trace
select throws_ok($$ select public.registrar_movimiento_stock(1, 424242, 'entrada', 1, null) $$, null, 'unknown product rejected');
select throws_ok($$ select public.registrar_movimiento_stock(1, 9101, 'venta', 1, null) $$, null, 'tipo venta is not allowed here');
select throws_ok($$ select public.registrar_movimiento_stock(1, 9101, 'entrada', 0, null) $$, null, 'entrada needs a positive quantity');
select throws_ok($$ select public.registrar_movimiento_stock(1, 9101, 'ajuste', 2, '  ') $$, null, 'ajuste needs a reason');
select is((select stock from public.productos where id = 9101), 14.000::numeric, 'rejected calls did not touch stock');

select * from finish();
rollback;
