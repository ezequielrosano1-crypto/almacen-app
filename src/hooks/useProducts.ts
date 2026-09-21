import { useState } from "react";
import { toProductUpsert } from "../data/mappers";
import {
  updateProductStock as defaultUpdateProductStock,
  upsertProduct as defaultUpsertProduct,
} from "../data/productsRepository";
import { initialProducts } from "../lib/initialData";
import type { MeasurementUnit, ProductId } from "../types/domain";

export interface ProductItem {
  id: ProductId;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
  unidad?: string;
  unit?: string;
  stock: number;
  stockMinimo?: number;
  minimumStock?: number;
  codigoBarras?: string | null;
  barcode?: string | null;
  [key: string]: unknown;
}

export function applyStockUpdate(
  products: ProductItem[],
  id: ProductId,
  nuevoStock: number,
): ProductItem[] {
  return products.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p));
}

export function applyProductSave(products: ProductItem[], product: ProductItem): ProductItem[] {
  const existe = products.some((p) => p.id === product.id);
  return existe ? products.map((p) => (p.id === product.id ? product : p)) : [...products, product];
}

export async function updateStockInRepository(
  id: ProductId,
  nuevoStock: number,
  deps = { updateProductStock: defaultUpdateProductStock },
): Promise<boolean> {
  try {
    await deps.updateProductStock(id, nuevoStock);
    return true;
  } catch (error) {
    console.error("Error actualizando stock en Supabase:", error);
    if (typeof alert !== "undefined") {
      alert("No se pudo actualizar el stock.");
    }
    return false;
  }
}

export async function saveProductToRepository(
  producto: ProductItem,
  deps = { upsertProduct: defaultUpsertProduct },
): Promise<boolean> {
  const name = (producto.name ?? producto.nombre ?? "") as string;
  const price = Number(producto.price ?? producto.precio ?? 0);
  const unit = (producto.unit ?? producto.unidad ?? "unidad") as MeasurementUnit;
  const stock = Number(producto.stock ?? 0);
  const minimumStock = Number(producto.minimumStock ?? producto.stockMinimo ?? 0);
  const barcode = ((producto.barcode ?? producto.codigoBarras ?? "") as string).trim() || null;

  const productoSupabase = toProductUpsert({
    id: producto.id,
    name,
    price,
    unit,
    stock,
    minimumStock,
    barcode,
  });

  try {
    await deps.upsertProduct(productoSupabase);
    return true;
  } catch (error) {
    console.error("Error guardando producto en Supabase:", error);
    if (typeof alert !== "undefined") {
      alert("No se pudo guardar el producto.");
    }
    return false;
  }
}

export function useProducts(
  initial: ProductItem[] = initialProducts() as unknown as ProductItem[],
  deps = {
    updateProductStock: defaultUpdateProductStock,
    upsertProduct: defaultUpsertProduct,
  },
) {
  const [products, setProducts] = useState<ProductItem[]>(initial);

  const updateStock = async (id: ProductId, nuevoStock: number): Promise<boolean> => {
    const ok = await updateStockInRepository(id, nuevoStock, deps);
    if (!ok) return false;

    setProducts((prev) => applyStockUpdate(prev, id, nuevoStock));
    return true;
  };

  const saveProduct = async (producto: ProductItem): Promise<boolean> => {
    const ok = await saveProductToRepository(producto, deps);
    if (!ok) return false;

    setProducts((prev) => applyProductSave(prev, producto));
    return true;
  };

  return {
    products,
    setProducts,
    updateStock,
    saveProduct,
    // Alias en español para App.jsx
    productos: products,
    setProductos: setProducts,
    actualizarStock: updateStock,
    guardarProducto: saveProduct,
  };
}

export default useProducts;
