export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-UY")}`;
}

export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.toLocaleDateString("es-UY", {
    timeZone: "America/Montevideo",
    day: "2-digit",
    month: "2-digit",
  })} ${d.toLocaleTimeString("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })}`;
}
