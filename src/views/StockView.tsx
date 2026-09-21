import { Header } from "../components/Header";
import { Row } from "../components/Row";
import type { ScreenId, ScreenParams } from "../types/navigation";

export interface StockViewProps {
  push: (screen: ScreenId, params?: ScreenParams) => void;
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
