import { useState } from "react";
import { COLORS } from "../lib/constants";
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
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-ink-muted px-1">Empezar de cero</p>
      <p className="text-xs text-ink-muted px-1">
        Borra todos los productos y todo el historial de ventas de este dispositivo. La caja
        (abierta/cerrada) no se toca. No se puede deshacer.
      </p>
      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="w-full text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#DC2626", borderColor: "#E2E8F0" }}
        >
          Borrar todos los productos y ventas
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.agotado }}>
            ¿Seguro? Esto borra todo y no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="flex-1 text-sm rounded-xl px-3 py-2.5 border"
              style={{ backgroundColor: "#FFFFFF", color: "#374151", borderColor: "#E2E8F0" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={borrarTodo}
              disabled={borrando}
              className="flex-1 text-sm rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
            >
              {borrando ? "Borrando..." : "Sí, borrar todo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearDataView;
