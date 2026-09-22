import { useState } from "react";
import { toProductInsert, toProductUpsert } from "../data/mappers";
import {
  deleteProduct as defaultDeleteProduct,
  insertProduct as defaultInsertProduct,
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

// A product that was never saved has no id yet: the database assigns it on insert.
export type ProductDraft = Omit<ProductItem, "id"> & { id?: ProductId };

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

export async function deleteProductFromRepository(
  id: ProductId,
  deps = { deleteProduct: defaultDeleteProduct },
): Promise<boolean> {
  try {
    await deps.deleteProduct(id);
    return true;
  } catch (error) {
    console.error("Error eliminando producto en Supabase:", error);
    if (typeof alert !== "undefined") {
      const code = (error as { code?: string } | null)?.code;
      alert(
        code === "23503"
          ? "No se puede eliminar: el producto tiene ventas o movimientos registrados."
          : "No se pudo eliminar el producto.",
      );
    }
    return false;
  }
}

export async function saveProductToRepository(
  producto: ProductDraft,
  deps = { upsertProduct: defaultUpsertProduct, insertProduct: defaultInsertProduct },
): Promise<ProductItem | null> {
  const name = (producto.name ?? producto.nombre ?? "") as string;
  const price = Number(producto.price ?? producto.precio ?? 0);
  const unit = (producto.unit ?? producto.unidad ?? "unidad") as MeasurementUnit;
  const stock = Number(producto.stock ?? 0);
  const minimumStock = Number(producto.minimumStock ?? producto.stockMinimo ?? 0);
  const barcode = ((producto.barcode ?? producto.codigoBarras ?? "") as string).trim() || null;
  const fields = { name, price, unit, stock, minimumStock, barcode };

  try {
    if (producto.id === undefined) {
      const created = await deps.insertProduct(toProductInsert(fields));
      return { ...(producto as ProductItem), id: created.id };
    }

    await deps.upsertProduct(toProductUpsert({ id: producto.id, ...fields }));
    return { ...(producto as ProductItem), id: producto.id };
  } catch (error) {
    console.error("Error guardando producto en Supabase:", error);
    if (typeof alert !== "undefined") {
      alert("No se pudo guardar el producto.");
    }
    return null;
  }
}

export function useProducts(
  initial: ProductItem[] = initialProducts() as unknown as ProductItem[],
  deps = {
    updateProductStock: defaultUpdateProductStock,
    upsertProduct: defaultUpsertProduct,
    insertProduct: defaultInsertProduct,
    deleteProduct: defaultDeleteProduct,
  },
) {
  const [products, setProducts] = useState<ProductItem[]>(initial);

  const updateStock = async (id: ProductId, nuevoStock: number): Promise<boolean> => {
    const ok = await updateStockInRepository(id, nuevoStock, deps);
    if (!ok) return false;

    setProducts((prev) => applyStockUpdate(prev, id, nuevoStock));
    return true;
  };

  const saveProduct = async (producto: ProductDraft): Promise<boolean> => {
    const saved = await saveProductToRepository(producto, deps);
    if (!saved) return false;

    setProducts((prev) => applyProductSave(prev, saved));
    return true;
  };

  const deleteProduct = async (id: ProductId): Promise<boolean> => {
    const ok = await deleteProductFromRepository(id, deps);
    if (!ok) return false;

    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  return {
    products,
    setProducts,
    updateStock,
    saveProduct,
    deleteProduct,
    // Alias en español para App.jsx
    productos: products,
    setProductos: setProducts,
    actualizarStock: updateStock,
    guardarProducto: saveProduct,
    eliminarProducto: deleteProduct,
  };
}

export default useProducts;
