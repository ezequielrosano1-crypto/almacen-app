// STOCKIA brand color tokens, shared with tailwind.config.js and src/index.css.
// Use these for inline `style` props and lucide-react `color` props where a
// Tailwind class isn't practical.
export const colors = {
  carbon: "#0F172A",
  brand: "#0066FF",
  brandLight: "#4DA3FF",
  brand50: "#EBF3FF",
  brand100: "#CCE0FF",
  ink: "#1F2937",
  inkSoft: "#374151",
  inkMuted: "#64748B",
  inkSubtle: "#94A3B8",
  line: "#E2E8F0",
  lineSoft: "#F1F5F9",
  surface: "#FFFFFF",
  canvas: "#F5F7FB",
  success: "#16A34A",
  success50: "#DCFCE7",
  warning: "#F59E0B",
  warning50: "#FEF3C7",
  danger: "#DC2626",
  danger50: "#FEE2E2",
} as const;

export type ColorToken = keyof typeof colors;
