import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { removeKey } from "../lib/storage/storage";

export function ClearDataView() {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const borrarTodo = async () => {
    setBorrando(true);
    try {
      await removeKey("datos:productos");
    } catch (_e) {
      // Ignorar error al borrar productos
    }
    try {
      await removeKey("datos:movimientos");
    } catch (_e) {
      // Ignorar error al borrar movimientos
    }
    window.location.reload();
  };

  return (
    <Card className="space-y-2">
      <p className="text-xs font-semibold text-ink-muted px-1">Empezar de cero</p>
      <p className="text-xs text-ink-muted px-1">
        Borra todos los productos y todo el historial de ventas de este dispositivo. La caja
        (abierta/cerrada) no se toca. No se puede deshacer.
      </p>
      {!confirmando ? (
        <Button
          variant="secondary"
          onClick={() => setConfirmando(true)}
          className="w-full text-danger border-danger-50 hover:bg-danger-50"
        >
          Borrar todos los productos y ventas
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-danger px-1">
            ¿Seguro? Esto borra todo y no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmando(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={borrarTodo} disabled={borrando} className="flex-1">
              {borrando && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
              {borrando ? "Borrando..." : "Sí, borrar todo"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default ClearDataView;
