import type { ClockOverride, UruguayClock } from "../types/domain";

export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toDateString() === new Date().toDateString();
}

export function todayDateKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function localDateKey(date: Date | string): string {
  if (typeof date === "string") return date;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function uruguayDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function uruguayWeekdayLabel(date: Date): string {
  const dia = new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    weekday: "short",
  }).format(date);
  return dia.replace(".", "");
}

export function nowInUruguay(override?: ClockOverride): UruguayClock {
  if (override) {
    const { hourNumber, date } = override;
    const hh = String(Math.floor(hourNumber)).padStart(2, "0");
    const mm = String(Math.round((hourNumber % 1) * 60)).padStart(2, "0");
    return { date, time: `${hh}:${mm}`, hourNumber };
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
    hourNumber: Number(get("hour")) + Number(get("minute")) / 60,
  };
}

export function formatUruguayTime(): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}
