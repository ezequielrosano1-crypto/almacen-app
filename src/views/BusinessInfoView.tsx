import { useState } from "react";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";

export interface BusinessInfoData {
  nombre?: string;
  name?: string;
  contacto?: string;
  contact?: string;
}

export interface BusinessInfoViewProps {
  businessInfo?: BusinessInfoData;
  infoNegocio?: BusinessInfoData;
  saveBusinessInfo?: (info: { nombre: string; contacto: string }) => void;
  guardarInfoNegocio?: (info: { nombre: string; contacto: string }) => void;
  pop: () => void;
}

export function BusinessInfoView(props: BusinessInfoViewProps) {
  const { pop } = props;
  const info = props.businessInfo ?? props.infoNegocio ?? {};
  const save = props.saveBusinessInfo ?? props.guardarInfoNegocio ?? (() => {});

  const [nombre, setNombre] = useState(info.nombre ?? info.name ?? "");
  const [contacto, setContacto] = useState(info.contacto ?? info.contact ?? "");

  const guardar = () => {
    if (!nombre) return;
    save({ nombre, contacto });
    pop();
  };

  return (
    <div>
      <Header title="Información del negocio" onBack={pop} />
      <div className="px-5 space-y-3">
        <div>
          <label className="text-stone-500 text-sm block">
            Nombre del almacén
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
            />
          </label>
        </div>
        <div>
          <label className="text-stone-500 text-sm block">
            Teléfono / WhatsApp de contacto
            <input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
            />
          </label>
        </div>
        <div className="pt-1">
          <PrimaryButton onClick={guardar} disabled={!nombre}>
            Guardar cambios
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
