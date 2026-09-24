import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { ProductList } from "../components/ProductList";
import type { ProductRowItem } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import type { ProductId } from "../types/domain";

export interface ProductsViewProps {
  products?: ProductRowItem[];
  pop: () => void;
  onOpenDetail?: (id: ProductId) => void;
  onNew?: () => void;
}

export function ProductsView(props: ProductsViewProps) {
  const { pop } = props;
  const products = props.products ?? [];
  const onOpenDetail = props.onOpenDetail ?? (() => {});
  const onNew = props.onNew ?? (() => {});

  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={pop} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#374151" />
          </button>
          <h1 className="text-2xl font-bold text-ink">Productos</h1>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="rounded-full p-2"
          style={{ backgroundColor: "#0066FF" }}
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
