// Contador a nivel de módulo que inicia en 1000 en cada carga de módulo (preserva bug #1).
let idCounter = 1000;

export function nextId(): number {
  return idCounter++;
}
