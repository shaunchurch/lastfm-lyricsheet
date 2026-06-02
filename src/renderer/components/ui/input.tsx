import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "app-no-drag h-10 w-full rounded-md border border-white/14 bg-black/28 px-3 text-sm text-white outline-none transition placeholder:text-white/34 focus:border-white/34 focus:ring-2 focus:ring-white/14",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
