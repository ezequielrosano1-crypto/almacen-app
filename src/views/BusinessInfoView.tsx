import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { Field, FieldError, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { validateBusinessInfo } from "../lib/validation/forms";

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
  const [guardando, setGuardando] = useState(false);
  const [nombreError, setNombreError] = useState<string | undefined>();
  const nombreRef = useRef<HTMLInputElement>(null);

  const guardar = async () => {
    if (guardando) return;
    const errors = validateBusinessInfo({ nombre });
    setNombreError(errors.nombre);
    if (errors.nombre) {
      nombreRef.current?.focus();
      return;
    }

    setGuardando(true);
    try {
      await save({ nombre, contacto });
      pop();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pb-4 lg:max-w-2xl">
      <PageHeader title="Información del negocio" onBack={pop} />
      <Card className="space-y-4">
        <Field data-invalid={Boolean(nombreError)}>
          <FieldLabel htmlFor="business-name">Nombre del almacén</FieldLabel>
          <Input
            id="business-name"
            ref={nombreRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="organization"
            aria-invalid={Boolean(nombreError)}
            aria-describedby={nombreError ? "business-name-error" : undefined}
            className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
          />
          <FieldError id="business-name-error">{nombreError}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="business-contact">Teléfono / WhatsApp de contacto</FieldLabel>
          <Input
            id="business-contact"
            type="tel"
            inputMode="tel"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            autoComplete="tel"
            className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>
        <Button fullWidth onClick={guardar} disabled={guardando}>
          {guardando && <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" />}
          Guardar cambios
        </Button>
      </Card>
    </div>
  );
}
