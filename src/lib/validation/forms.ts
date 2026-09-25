// Pure client-side form validation, extracted from the views' previous inline
// "puedeGuardar"-style boolean checks (shadcn-views T3). Same validity rules
// as before, now expressed as a field -> message map so views can show
// per-field errors (aria-invalid + FieldError) instead of only disabling the
// submit button. Messages are Rioplatense Spanish (voseo).
export type FieldErrors = Record<string, string>;

export interface ProductFormFields {
  nombre: string;
  precio: string;
  stock: string;
  stockMinimo: string;
}

function parseNumber(value: string): number {
  return Number.parseFloat(value);
}

export function validateProductForm(fields: ProductFormFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.nombre.trim()) {
    errors.nombre = "Ingresá un nombre";
  }

  if (fields.precio.trim() === "") {
    errors.precio = "Ingresá un precio";
  } else if (!(parseNumber(fields.precio) > 0)) {
    errors.precio = "El precio tiene que ser mayor a 0";
  }

  if (fields.stock.trim() === "") {
    errors.stock = "Ingresá el stock";
  } else if (parseNumber(fields.stock) < 0) {
    errors.stock = "El stock no puede ser negativo";
  }

  if (fields.stockMinimo.trim() === "") {
    errors.stockMinimo = "Ingresá el stock mínimo";
  } else if (parseNumber(fields.stockMinimo) < 0) {
    errors.stockMinimo = "El stock mínimo no puede ser negativo";
  }

  return errors;
}

export interface BusinessInfoFields {
  nombre: string;
}

export function validateBusinessInfo(fields: BusinessInfoFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.nombre.trim()) {
    errors.nombre = "Ingresá el nombre del almacén";
  }

  return errors;
}

export interface StockEntryFields {
  cantidad: string;
}

export function validateStockEntry(fields: StockEntryFields): FieldErrors {
  const errors: FieldErrors = {};

  if (fields.cantidad.trim() === "") {
    errors.cantidad = "Ingresá la cantidad";
  } else if (!(parseNumber(fields.cantidad) > 0)) {
    errors.cantidad = "La cantidad tiene que ser mayor a 0";
  }

  return errors;
}

export interface StockAdjustmentFields {
  stockReal: string;
  motivo: string | null;
}

export function validateStockAdjustment(fields: StockAdjustmentFields): FieldErrors {
  const errors: FieldErrors = {};

  if (fields.stockReal.trim() === "") {
    errors.stockReal = "Ingresá el stock contado";
  } else if (Number.isNaN(parseNumber(fields.stockReal)) || parseNumber(fields.stockReal) < 0) {
    errors.stockReal = "El stock no puede ser negativo";
  }

  if (!fields.motivo) {
    errors.motivo = "Elegí un motivo";
  }

  return errors;
}
