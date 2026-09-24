import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactElement } from "react";

export type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "py-2 px-3 text-sm gap-1.5",
  md: "py-3 px-4 text-base gap-2",
  lg: "py-4 px-5 text-lg gap-2",
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white",
  secondary: "bg-white text-brand border border-brand",
  dark: "bg-carbon text-white",
  ghost: "bg-transparent text-ink-soft",
};

const DISABLED_CLASSES = "bg-line text-ink-muted border-transparent cursor-not-allowed";

// Shared button primitive matching the STOCKIA UI kit; variants: primary,
// secondary (outline), dark and ghost.
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  fullWidth,
  disabled,
  className,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "appearance-none inline-flex items-center justify-center font-display font-semibold rounded-xl transition-colors",
        SIZE_CLASSES[size],
        disabled ? DISABLED_CLASSES : VARIANT_CLASSES[variant],
        fullWidth ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {Icon && <Icon size={ICON_SIZE[size]} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={ICON_SIZE[size]} strokeWidth={2} />}
    </button>
  );
}
