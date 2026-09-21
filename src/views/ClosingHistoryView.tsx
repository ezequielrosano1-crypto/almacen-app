import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { COLORS } from "../lib/constants";
import { formatMoney } from "../lib/format";
import { listKeys, readJson } from "../lib/storage/storage";

export interface ClosingHistoryItem {
  fecha: string;
  hora: string;
  total: number;
  cantidadVentas: number;
  automatico?: boolean;
}

export interface ClosingHistoryViewProps {
  pop: () => void;
}

export function ClosingHistoryView({ pop }: ClosingHistoryViewProps) {
  const [cargando, setCargando] = useState(true);
  const [cierres, setCierres] = useState<ClosingHistoryItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        // Recorre todas las claves "cierre:YYYY-MM-DD" guardadas (una por
        // cada día cerrado, manual o automáticamente) y trae cada resumen.
        const listado = await listKeys("cierre:");
        const claves = (listado || []).slice().sort().reverse();
        const registros: ClosingHistoryItem[] = [];
        for (const clave of claves) {
          try {
            const data = await readJson<ClosingHistoryItem>(clave);
            if (data) registros.push(data);
          } catch (_e) {
            // Ignorar errores al leer claves individuales
          }
        }
        if (activo) setCierres(registros);
      } catch (_e) {
        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="px-5 space-y-3 pb-6">
      <Header title="Historial de cierres" onBack={pop} />
      {cargando ? (
        <p className="text-stone-400 text-sm text-center py-6">Cargando historial...</p>
      ) : error ? (
        <p className="text-stone-400 text-sm text-center py-6">No se pudo cargar el historial.</p>
      ) : cierres.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-6">
          Todavía no hay ningún día cerrado.
        </p>
      ) : (
        <div className="space-y-2">
          {cierres.map((c) => (
            <div
              key={`${c.fecha}-${c.hora}`}
              className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-800">{c.fecha}</p>
                <span
                  className="text-xs font-medium"
                  style={{ color: c.automatico ? COLORS.bajo : COLORS.principal }}
                >
                  {c.automatico ? "Cierre automático" : "Cierre manual"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Hora de cierre</span>
                <span className="text-stone-800 font-medium">{c.hora}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total</span>
                <span className="text-stone-800 font-medium">{formatMoney(c.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cantidad de ventas</span>
                <span className="text-stone-800 font-medium">{c.cantidadVentas}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
