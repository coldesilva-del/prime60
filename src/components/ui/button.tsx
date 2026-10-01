import * as React from "react";
import Link from "next/link";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * Prime 60 button. Sizes start at 44px so every control is thumb-safe.
 * Variants: primary (harbour), secondary (surface), ghost, destructive (ember), link.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[15px] font-medium transition-[background-color,transform,opacity] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-surface-raised text-ink hover:bg-hairline/70",
        outline: "border border-hairline bg-surface text-ink hover:bg-surface-raised",
        ghost: "text-ink hover:bg-surface-raised",
        destructive: "bg-ember/10 text-ember hover:bg-ember/20",
        link: "text-harbour underline-offset-4 hover:underline h-auto p-0",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-11 px-4 text-sm",
        lg: "h-14 px-6 text-base",
        full: "h-12 w-full px-5",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      nativeButton={nativeButton ?? !render}
      {...props}
    />
  );
}

/** A real link styled as a button. Use for navigation so assistive tech hears "link". */
function ButtonLink({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link data-slot="button-link" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, ButtonLink, buttonVariants };
