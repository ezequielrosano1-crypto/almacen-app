import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";

export type ButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  /** Disables the press scale animation (better-ui/animations.md). */
  static?: boolean;
}

type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & ButtonOwnProps;

// Icon-only buttons (no visible text children) must carry an aria-label so the
// accessible name isn't empty (better-accessibility "Accessible names everywhere").
export type ButtonProps =
  | (ButtonBaseProps & { children: ReactNode; "aria-label"?: string })
  | (ButtonBaseProps & { children?: undefined; "aria-label": string });

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 pointer-coarse:h-10 px-3 text-sm gap-1.5",
  md: "h-10 pointer-coarse:h-11 px-4 text-sm gap-2",
  lg: "h-11 pointer-coarse:h-12 px-5 text-base gap-2",
};

// Optical trailing-icon padding: icon side = text side - 2px (better-ui/surfaces.md).
const PADDING_END_WITH_TRAILING_ICON: Record<ButtonSize, string> = {
  sm: "pe-2.5",
  md: "pe-3.5",
  lg: "pe-4.5",
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

// Our variant -> shadcn base variant + full override classes (later classes in
// `cn` win over the base variant's conflicting utilities).
const SHADCN_VARIANT: Record<ButtonVariant, "default" | "outline" | "ghost" | "destructive"> = {
  primary: "default",
  secondary: "outline",
  dark: "default",
  ghost: "ghost",
  destructive: "destructive",
};

const VARIANT_OVERRIDE_CLASSES: Record<ButtonVariant, string> = {
  primary: "",
  secondary: "border-brand text-brand bg-white hover:bg-brand-50 hover:text-brand",
  dark: "bg-carbon text-white border-transparent hover:bg-carbon",
  ghost: "text-ink-soft hover:bg-line-soft hover:text-ink-soft",
  destructive: "",
};

// Mira's base Button stacks `disabled:opacity-50` on top; neutralize it so a
// disabled button looks exactly like our bg-line/text-ink-muted token pair,
// not that pair faded to 50% (Phase A follow-up).
const DISABLED_CLASSES =
  "disabled:bg-line disabled:text-ink-muted disabled:border-transparent disabled:opacity-100";

// Shared button primitive matching the STOCKIA UI kit, now built on the
// shadcn/ui (Mira) Button. Variants: primary, secondary (outline), dark,
// ghost and destructive.
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  fullWidth,
  static: isStatic,
  disabled,
  className,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <ShadcnButton
      type="button"
      variant={SHADCN_VARIANT[variant]}
      disabled={disabled}
      className={cn(
        "font-display font-semibold rounded-xl border",
        "transition-[color,background-color,border-color,box-shadow,scale] duration-150 ease-out",
        "active:translate-y-0",
        !isStatic && "motion-safe:active:not-disabled:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        SIZE_CLASSES[size],
        VARIANT_OVERRIDE_CLASSES[variant],
        IconRight && PADDING_END_WITH_TRAILING_ICON[size],
        DISABLED_CLASSES,
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={ICON_SIZE[size]} strokeWidth={2} data-icon="inline-start" />}
      {children}
      {IconRight && <IconRight size={ICON_SIZE[size]} strokeWidth={2} data-icon="inline-end" />}
    </ShadcnButton>
  );
}
