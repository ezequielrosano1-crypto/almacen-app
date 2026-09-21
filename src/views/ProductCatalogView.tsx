import { useState } from "react";
import { Header } from "../components/Header";
import { ProductList } from "../components/ProductList";
import type { ProductRowItem } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import type { ProductId } from "../types/domain";

export interface ProductCatalogViewProps {
  products?: ProductRowItem[];
  productos?: ProductRowItem[];
  pop: () => void;
  onOpenDetail?: (id: ProductId) => void;
  onOpenDetalle?: (id: ProductId) => void;
}

export function ProductCatalogView(props: ProductCatalogViewProps) {
  const { pop } = props;
  const products = props.products ?? props.productos ?? [];
  const onOpenDetail = props.onOpenDetail ?? props.onOpenDetalle ?? (() => {});
  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <Header title="Ver productos" onBack={pop} />
      <div className="px-5 space-y-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
        <ProductList productos={products} busqueda={busqueda} onProductoClick={onOpenDetail} />
      </div>
    </div>
  );
}
