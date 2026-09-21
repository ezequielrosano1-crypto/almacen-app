begin;
select plan(4);

select is(
  (select is_identity from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'id'),
  'YES', 'productos.id is an identity column');

insert into public.productos (id, negocio_id, nombre, precio, unidad, stock, stock_minimo)
values (5000, 1, 'Explicit id', 1, 'unidad', 1, 0);

select lives_ok($$
  insert into public.productos (nombre, precio, unidad, stock, stock_minimo)
  values ('Generated A', 1, 'unidad', 1, 0)
$$, 'insert without id generates one');

select lives_ok($$
  insert into public.productos (nombre, precio, unidad, stock, stock_minimo)
  values ('Generated B', 1, 'unidad', 1, 0)
$$, 'second insert without id also works');

select is(
  (select count(distinct id)::int from public.productos where nombre like 'Generated %'),
  2, 'generated ids are distinct');

select * from finish();
rollback;
