import { Header } from "../components/Header";
import CashRegisterSandboxView from "./CashRegisterSandboxView";
import ClearDataView from "./ClearDataView";

export interface SettingsViewProps {
  pop: () => void;
}

export function SettingsView({ pop }: SettingsViewProps) {
  return (
    <div>
      <Header title="Configuración" onBack={pop} />
      <div className="px-5 space-y-4 pb-6">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-8 text-center">
          <p className="text-stone-600 font-medium">Configuración</p>
          <p className="text-stone-400 text-sm mt-2">
            Esta sección estará disponible en una etapa futura.
          </p>
        </div>
        <ClearDataView />
        <div>
          <p className="text-xs font-semibold text-stone-500 px-1 mb-2">
            Pruebas · caja automática
          </p>
          <CashRegisterSandboxView />
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
