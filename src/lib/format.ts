// Two-letter avatar initials from a business/person name: first letter of the
// first two words, or the first two letters of a single word. "?" when blank.
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    const word = words[0];
    return word.length === 1 ? word.toUpperCase() : word.slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

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
