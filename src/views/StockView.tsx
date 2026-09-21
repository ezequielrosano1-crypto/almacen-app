import { Header } from "../components/Header";
import { Row } from "../components/Row";

export interface StockViewProps {
  push: (screen: string, params?: Record<string, unknown>) => void;
}

export function StockView({ push }: StockViewProps) {
  return (
    <div>
      <Header title="Stock" />
      <div className="px-5 space-y-3">
        <Row label="Ver productos" onClick={() => push("productCatalog")} />
        <Row label="Stock bajo" onClick={() => push("lowStock")} />
        <Row label="Agregar entrada" onClick={() => push("addStockEntry")} />
        <Row label="Ajustar stock" onClick={() => push("adjustStock")} />
      </div>
    </div>
  );
}
