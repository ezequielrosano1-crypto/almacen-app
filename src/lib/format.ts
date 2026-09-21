export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-UY")}`;
}

export function formatDate(date: Date): string {
  return `${date.toLocaleDateString("es-UY", {
    timeZone: "America/Montevideo",
    day: "2-digit",
    month: "2-digit",
  })} ${date.toLocaleTimeString("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })}`;
}
