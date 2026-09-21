import { useState } from "react";
import { Header } from "../components/Header";
import { ProductList } from "../components/ProductList";
import type { ProductRowItem } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import type { ProductId } from "../types/domain";

export interface ProductCatalogViewProps {
  products?: ProductRowItem[];
  pop: () => void;
  onOpenDetail?: (id: ProductId) => void;
}

export function ProductCatalogView(props: ProductCatalogViewProps) {
  const { pop } = props;
  const products = props.products ?? [];
  const onOpenDetail = props.onOpenDetail ?? (() => {});
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
