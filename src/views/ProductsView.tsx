import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { ProductList } from "../components/ProductList";
import type { ProductRowItem } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import type { ProductId } from "../types/domain";

export interface ProductsViewProps {
  products?: ProductRowItem[];
  productos?: ProductRowItem[];
  pop: () => void;
  onOpenDetail?: (id: ProductId) => void;
  onOpenDetalle?: (id: ProductId) => void;
  onNew?: () => void;
  onNuevo?: () => void;
}

export function ProductsView(props: ProductsViewProps) {
  const { pop } = props;
  const products = props.products ?? props.productos ?? [];
  const onOpenDetail = props.onOpenDetail ?? props.onOpenDetalle ?? (() => {});
  const onNew = props.onNew ?? props.onNuevo ?? (() => {});

  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={pop} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#57534E" />
          </button>
          <h1 className="text-2xl font-bold text-stone-800">Productos</h1>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="rounded-full p-2"
          style={{ backgroundColor: "#2E6B4F" }}
        >
          <Plus size={20} color="white" />
        </button>
      </div>
      <div className="px-5 space-y-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
        <ProductList productos={products} busqueda={busqueda} onProductoClick={onOpenDetail} />
      </div>
    </div>
  );
}
