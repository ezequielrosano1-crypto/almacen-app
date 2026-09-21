import { Header } from "../components/Header";
import { Row } from "../components/Row";
import type { ScreenId, ScreenParams } from "../types/navigation";

export interface MoreViewProps {
  push: (screen: ScreenId, params?: ScreenParams) => void;
}

export function MoreView({ push }: MoreViewProps) {
  return (
    <div>
      <Header title="Más" />
      <div className="px-5 space-y-3">
        <Row label="Productos" onClick={() => push("products")} />
        <Row label="Información del negocio" onClick={() => push("businessInfo")} />
        <Row label="Configuración" onClick={() => push("settings")} />
      </div>
    </div>
  );
}
