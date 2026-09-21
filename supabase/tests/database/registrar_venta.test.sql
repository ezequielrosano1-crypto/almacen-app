begin;
select plan(9);

insert into public.productos (id, negocio_id, nombre, precio, unidad, stock, stock_minimo)
values (9001, 1, 'Yerba', 190, 'unidad', 10, 1),
       (9002, 1, 'Manzanas', 80, 'kg', 5, 1);

-- happy path: one call creates the sale, its items and decrements stock
select lives_ok($$
  select public.registrar_venta(
    1, null, 'Efectivo', 350,
    '[{"producto_id":9001,"nombre":"Yerba","cantidad":1,"unidad":"unidad","precio_unitario":190,"subtotal":190},
      {"producto_id":9002,"nombre":"Manzanas","cantidad":2,"unidad":"kg","precio_unitario":80,"subtotal":160}]'::jsonb)
$$, 'registrar_venta accepts a valid sale');

select is((select count(*)::int from public.ventas where total = 350), 1, 'one sale row');
select is((select count(*)::int from public.venta_items i join public.ventas v on v.id = i.venta_id where v.total = 350), 2, 'two item rows');
select is((select stock from public.productos where id = 9001), 9.000::numeric, 'stock 9001 decremented');
select is((select stock from public.productos where id = 9002), 3.000::numeric, 'stock 9002 decremented');

-- failure on the second item (unknown product) rolls EVERYTHING back
select throws_ok($$
  select public.registrar_venta(
    1, null, 'Débito', 999,
    '[{"producto_id":9001,"nombre":"Yerba","cantidad":1,"unidad":"unidad","precio_unitario":190,"subtotal":190},
      {"producto_id":424242,"nombre":"Fantasma","cantidad":1,"unidad":"kg","precio_unitario":1,"subtotal":1}]'::jsonb)
$$, null, 'unknown product aborts the sale');

select is((select count(*)::int from public.ventas where total = 999), 0, 'failed sale left no ventas row');
select is((select stock from public.productos where id = 9001), 9.000::numeric, 'failed sale left stock untouched');

-- empty cart is rejected
select throws_ok($$
  select public.registrar_venta(1, null, 'Efectivo', 0, '[]'::jsonb)
$$, null, 'empty cart is rejected');

select * from finish();
rollback;
