import type * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        brand: "bg-brand-soft text-brand",
        hot: "bg-[#fff0f9] text-hot",
        cyan: "bg-[#ecfaff] text-[#0088c7]",
        graphite: "bg-[#f4f5f9] text-graphite",
        success: "bg-[#eefaf4] text-success",
        warning: "bg-[#fff7eb] text-warning",
        danger: "bg-[#fff0f0] text-danger",
      },
    },
    defaultVariants: {
      variant: "brand",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
