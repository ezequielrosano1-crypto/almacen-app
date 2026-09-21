# Storage Fixtures

Snapshot representativo del contenido de `localStorage` bajo la clave `almacen-app:storage-v1` antes del refactor modular.

## Estructura
- Clave raíz: `almacen-app:storage-v1`.
- Prefijos: `user:` y `shared:` según la API `window.storage`.
- Payloads incluidos:
  - `user:datos:movimientos`: movimientos de venta, entrada y ajuste con nombres de claves en español idénticos a los almacenados en disco (`src/types/storage.ts`).
  - `user:datos:infoNegocio`: objeto de negocio (`nombre`, `contacto`).
  - `user:cierre:<fecha>`: cierres de jornada, incluyendo entradas con y sin la bandera `automatico`.
  - `user:caja:jornada:test`: estado de jornada en sandbox de pruebas.
