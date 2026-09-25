import { useState } from "react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { syncCashShift } from "../data/cashShiftSync";
import { isScenarioPassing } from "../lib/cashShiftScenarios";
import { TEST_CASH_SHIFT_STORAGE_KEY } from "../lib/constants";
import { nextId } from "../lib/ids";
import { removeKey } from "../lib/storage/storage";
import type { StoredCashShift } from "../types/storage";

export const DAY_1 = "2026-09-14";
export const DAY_2 = "2026-09-15";

export interface SandboxScenario {
  id: string;
  label: string;
  fecha: string;
  horaNumero: number;
  esperado: string;
}

export const TEST_SCENARIOS: SandboxScenario[] = [
  {
    id: "s1",
    label: "07:59 · antes de apertura",
    fecha: DAY_1,
    horaNumero: 7 + 59 / 60,
    esperado: "CERRADA",
  },
  {
    id: "s2",
    label: "08:00 · apertura",
    fecha: DAY_1,
    horaNumero: 8,
    esperado: "ABIERTA",
  },
  {
    id: "s3",
    label: "12:00 · mediodía",
    fecha: DAY_1,
    horaNumero: 12,
    esperado: "ABIERTA",
  },
  {
    id: "s4",
    label: "21:59 · antes del cierre",
    fecha: DAY_1,
    horaNumero: 21 + 59 / 60,
    esperado: "ABIERTA",
  },
  {
    id: "s5",
    label: "22:00 · cierre automático",
    fecha: DAY_1,
    horaNumero: 22,
    esperado: "CERRADA",
  },
  {
    id: "s6",
    label: "23:00 · después del cierre",
    fecha: DAY_1,
    horaNumero: 23,
    esperado: "CERRADA",
  },
  {
    id: "s7",
    label: "08:00 día siguiente · nueva jornada",
    fecha: DAY_2,
    horaNumero: 8,
    esperado: "ABIERTA",
  },
];

interface LogEntry {
  id: string | number;
  texto: string;
  ok: boolean;
  hora: string;
}

export function CashRegisterSandboxView() {
  const [testCaja, setTestCaja] = useState<StoredCashShift | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [corriendo, setCorriendo] = useState(false);

  const agregarLog = (texto: string, ok: boolean) =>
    setLog((l) => [
      { id: nextId(), texto, ok, hora: new Date().toLocaleTimeString("es-UY") },
      ...l,
    ]);

  const correr = async (escenario: SandboxScenario) => {
    setCorriendo(true);
    const resultado = await syncCashShift([], {
      override: { fecha: escenario.fecha, horaNumero: escenario.horaNumero },
      storageKey: TEST_CASH_SHIFT_STORAGE_KEY,
    });
    setTestCaja(resultado);
    const estadoObtenido = resultado?.estado || "SIN DATOS";
    const ok = isScenarioPassing(escenario.esperado, estadoObtenido);
    agregarLog(
      `${escenario.label} → esperado ${escenario.esperado}, obtenido ${estadoObtenido}`,
      ok,
    );
    setCorriendo(false);
  };

  const correrIdempotencia = async () => {
    setCorriendo(true);
    const escenario = { fecha: DAY_1, horaNumero: 12 };
    const resultados: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await syncCashShift([], {
        override: escenario,
        storageKey: TEST_CASH_SHIFT_STORAGE_KEY,
      });
      resultados.push(JSON.stringify(r));
    }
    setTestCaja(JSON.parse(resultados[2]) as StoredCashShift);
    const estable = resultados[0] === resultados[1] && resultados[1] === resultados[2];
    agregarLog(
      estable
        ? "Ejecutada 3 veces seguidas a las 12:00 → mismo resultado, sin duplicar (OK)"
        : "Ejecutada 3 veces seguidas → los resultados difieren (revisar)",
      estable,
    );
    setCorriendo(false);
  };

  const intentarVentaConCajaCerrada = () => {
    const bloqueada = testCaja?.estado !== "ABIERTA";
    agregarLog(
      bloqueada
        ? "Intento de venta con caja cerrada → bloqueada correctamente (OK)"
        : "Intento de venta con caja cerrada → NO se bloqueó (revisar)",
      bloqueada,
    );
  };

  const reiniciarSandbox = async () => {
    setCorriendo(true);
    try {
      await removeKey(TEST_CASH_SHIFT_STORAGE_KEY);
    } catch (_e) {
      // Ignorar error al limpiar clave
    }
    setTestCaja(null);
    setLog([]);
    setCorriendo(false);
  };

  return (
    <div className="space-y-3">
      <Card className="space-y-1">
        <p className="text-sm font-semibold text-ink">Estado sandbox actual</p>
        {testCaja ? (
          <CashRegisterStatusCard caja={testCaja} totalHoy={0} />
        ) : (
          <p className="text-xs text-ink-subtle">Todavía no corriste ningún escenario.</p>
        )}
      </Card>

      <Card className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted px-1">Escenarios de horario</p>
        {TEST_SCENARIOS.map((e) => (
          <Button
            key={e.id}
            variant="secondary"
            disabled={corriendo}
            onClick={() => correr(e)}
            className="w-full justify-start text-left font-normal"
          >
            {e.label}
          </Button>
        ))}
      </Card>

      <Card className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted px-1">Otras verificaciones</p>
        <Button
          variant="secondary"
          disabled={corriendo}
          onClick={correrIdempotencia}
          className="w-full justify-start text-left font-normal"
        >
          Ejecutar 3 veces seguidas a las 12:00 (idempotencia)
        </Button>
        <Button
          variant="secondary"
          disabled={corriendo}
          onClick={intentarVentaConCajaCerrada}
          className="w-full justify-start text-left font-normal"
        >
          Simular intento de venta con la caja del sandbox cerrada
        </Button>
        <Button
          variant="secondary"
          disabled={corriendo}
          onClick={reiniciarSandbox}
          className="w-full justify-start text-left font-normal text-danger border-danger-50 bg-canvas hover:bg-danger-50"
        >
          Reiniciar sandbox de pruebas
        </Button>
      </Card>

      {log.length > 0 && (
        <Card className="space-y-2">
          <p className="text-xs font-semibold text-ink-muted px-1">Resultados</p>
          {log.map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-xs px-1">
              <span>{l.ok ? "✅" : "⚠️"}</span>
              <span className="text-ink-soft flex-1">{l.texto}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default CashRegisterSandboxView;
