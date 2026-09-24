import { useState } from "react";
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
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="w-full text-sm font-medium rounded-xl px-3 py-2.5 border border-line text-danger bg-white"
        >
          Borrar todos los productos y ventas
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-danger px-1">
            ¿Seguro? Esto borra todo y no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="flex-1 text-sm font-medium rounded-xl px-3 py-2.5 border border-line text-ink-soft bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={borrarTodo}
              disabled={borrando}
              className="flex-1 text-sm font-semibold rounded-xl px-3 py-2.5 bg-danger text-white disabled:opacity-60"
            >
              {borrando ? "Borrando..." : "Sí, borrar todo"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default ClearDataView;
