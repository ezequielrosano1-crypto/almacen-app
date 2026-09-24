import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

export interface BusinessInfoData {
  nombre?: string;
  name?: string;
  contacto?: string;
  contact?: string;
}

export interface BusinessInfoViewProps {
  businessInfo?: BusinessInfoData;
  saveBusinessInfo?: (info: { nombre: string; contacto: string }) => void;
  pop: () => void;
}

export function BusinessInfoView(props: BusinessInfoViewProps) {
  const { pop } = props;
  const info = props.businessInfo ?? {};
  const save = props.saveBusinessInfo ?? (() => {});

  const [nombre, setNombre] = useState(info.nombre ?? info.name ?? "");
  const [contacto, setContacto] = useState(info.contacto ?? info.contact ?? "");

  const guardar = () => {
    if (!nombre) return;
    save({ nombre, contacto });
    pop();
  };

  return (
    <div className="pb-4 lg:max-w-2xl">
      <PageHeader title="Información del negocio" onBack={pop} />
      <Card className="space-y-4">
        <div>
          <label className="text-ink-soft text-sm font-medium block" htmlFor="business-name">
            Nombre del almacén
          </label>
          <input
            id="business-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-line px-4 py-3 mt-1.5 outline-none text-ink focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <div>
          <label className="text-ink-soft text-sm font-medium block" htmlFor="business-contact">
            Teléfono / WhatsApp de contacto
          </label>
          <input
            id="business-contact"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            className="w-full rounded-xl border border-line px-4 py-3 mt-1.5 outline-none text-ink focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <Button fullWidth onClick={guardar} disabled={!nombre}>
          Guardar cambios
        </Button>
      </Card>
    </div>
  );
}
