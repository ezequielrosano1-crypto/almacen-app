export function legacyCantidadEnCarrito(carrito: unknown[], id: unknown): number;
export function legacyAgregarProducto(carrito: unknown[], producto: unknown): unknown[];
export function legacyCambiarCantidad(
  carrito: unknown[],
  productos: unknown[],
  id: unknown,
  delta: number,
): unknown[];
export function legacyQuitarProducto(carrito: unknown[], id: unknown): unknown[];
export function legacyCalculateItems(
  carrito: unknown[],
  productos: unknown[],
): { id: unknown; cantidad: number; producto: unknown; subtotal: number }[];
export function legacyCartTotal(items: { subtotal: number }[]): number;
