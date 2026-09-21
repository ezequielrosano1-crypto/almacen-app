import { useState } from "react";

export interface BusinessInfoData {
  nombre: string;
  contacto: string;
  name?: string;
  contact?: string;
}

export const DEFAULT_BUSINESS_INFO: BusinessInfoData = {
  nombre: "Almacén de la familia",
  contacto: "099 123 456",
  name: "Almacén de la familia",
  contact: "099 123 456",
};

export function applyBusinessInfoSave(
  _current: BusinessInfoData,
  datos: {
    nombre?: string;
    contacto?: string;
    name?: string;
    contact?: string;
  },
): BusinessInfoData {
  return {
    nombre: datos.nombre ?? datos.name ?? "",
    contacto: datos.contacto ?? datos.contact ?? "",
    name: datos.name ?? datos.nombre ?? "",
    contact: datos.contact ?? datos.contacto ?? "",
  };
}

export function useBusinessInfo(initial: BusinessInfoData = DEFAULT_BUSINESS_INFO) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoData>(initial);

  const saveBusinessInfo = (datos: {
    nombre?: string;
    contacto?: string;
    name?: string;
    contact?: string;
  }) => {
    setBusinessInfo((prev) => applyBusinessInfoSave(prev, datos));
  };

  return {
    businessInfo,
    setBusinessInfo,
    saveBusinessInfo,
    // Alias en español para App.jsx
    infoNegocio: businessInfo,
    setInfoNegocio: setBusinessInfo,
    guardarInfoNegocio: saveBusinessInfo,
  };
}

export default useBusinessInfo;
