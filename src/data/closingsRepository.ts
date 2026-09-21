import type { ClosingSummary } from "../types/domain";
import { listClosedShifts } from "./cashShiftRepository";
import { cashShiftRowToClosingSummary } from "./mappers";

export interface ClosingsDeps {
  listClosedShifts: typeof listClosedShifts;
}

const defaultDeps: ClosingsDeps = { listClosedShifts };

// Closings are not stored separately: every CERRADA row of `jornada` is one closing,
// so history and the shift itself can never disagree.
export async function listClosings(deps: ClosingsDeps = defaultDeps): Promise<ClosingSummary[]> {
  const rows = await deps.listClosedShifts();
  return rows.map(cashShiftRowToClosingSummary);
}
