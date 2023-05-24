import { cva, cx } from "class-variance-authority";

export const commonInteractionStyles = cva(
  "disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan-950/50"
)();

export const shimmerStyles = cva("animate-pulse rounded-lg bg-neutral-900");

export const buttonStyles = cva(
  cx("font-medium rounded-lg leading-none transition", commonInteractionStyles),
  {
    variants: {
      intent: {
        primary: "bg-cyan-950 p-2 text-cyan-200",
        secondary: "bg-white/5 text-white",
      },
      size: {
        small: "px-3 py-1.5 text-xs",
        medium: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      intent: "secondary",
      size: "medium",
    },
  }
);

export const errorMessage = cva("text-sm font-medium text-red-600");
