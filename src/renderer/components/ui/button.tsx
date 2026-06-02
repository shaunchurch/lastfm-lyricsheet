import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "app-no-drag inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-neutral-950 hover:bg-white/90",
        ghost: "text-white/82 hover:bg-white/12 hover:text-white",
        subtle: "bg-white/10 text-white hover:bg-white/16",
        chrome: "text-white/42 hover:bg-white/8 hover:text-white/86",
      },
      size: {
        default: "h-9 px-3",
        icon: "h-8 w-8 p-0",
        compactIcon: "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
