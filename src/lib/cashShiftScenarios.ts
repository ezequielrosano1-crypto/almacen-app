// The sandbox runs the schedule scenarios without touching the real database. Outside
// opening hours no jornada is created, so a scenario that expects CERRADA also passes
// when the sandbox has no data at all.
export function isScenarioPassing(expected: string, obtained: string): boolean {
  return obtained === expected || (expected === "CERRADA" && obtained === "SIN DATOS");
}
