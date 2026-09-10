import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

type Width = "wide" | "content" | "guide";

const widthClass: Record<Width, string> = {
  wide: "container-wide",
  content: "container-content",
  guide: "container-guide",
};

/**
 * apple.com sets content in a 980px column inside a 1440px viewport, with
 * section backgrounds running full-bleed behind it. Guide pages use a much
 * narrower 692px reading measure.
 */
export function Container({
  width = "content",
  as: Tag = "div",
  className,
  children,
}: {
  width?: Width;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn(widthClass[width], className)}>{children}</Tag>;
}
