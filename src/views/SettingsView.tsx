import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import CashRegisterSandboxView from "./CashRegisterSandboxView";
import ClearDataView from "./ClearDataView";

export interface SettingsViewProps {
  pop: () => void;
}

export function SettingsView({ pop }: SettingsViewProps) {
  return (
    <div className="pb-6 space-y-4 lg:max-w-2xl">
      <PageHeader title="Configuración" onBack={pop} />
      <Card className="text-center py-8">
        <p className="text-ink-soft font-medium">Preferencias</p>
        <p className="text-ink-subtle text-sm mt-2">
          Esta sección estará disponible en una etapa futura.
        </p>
      </Card>
      <ClearDataView />
      <div>
        <p className="text-xs font-semibold text-ink-muted px-1 mb-2">Pruebas · caja automática</p>
        <CashRegisterSandboxView />
      </div>
    </div>
  );
}

export default SettingsView;
