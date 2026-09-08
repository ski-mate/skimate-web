import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * iPhone bezel drawn in CSS rather than baked into the screenshot. Keeping the
 * frame as markup means it stays crisp at every DPR and a screenshot can be
 * swapped without re-compositing the image.
 *
 * Corner radius follows the concentric rule from
 * alpline-admin/apple-ui-brain/00-foundations/layout.md: the inner screen
 * radius is the outer radius minus the bezel inset.
 */
export function DeviceFrame({
  src,
  alt,
  width = 300,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  priority?: boolean;
  className?: string;
}) {
  // iPhone 16 Pro aspect: 1179 x 2556 logical points.
  const height = Math.round((width * 2556) / 1179);
  const bezel = Math.max(6, Math.round(width * 0.028));
  const outerRadius = Math.round(width * 0.155);

  return (
    <div
      className={cn("relative mx-auto shrink-0", className)}
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 bg-[#1c1c1e] shadow-float"
        style={{ borderRadius: outerRadius, padding: bezel }}
      >
        <div
          className="relative h-full w-full overflow-hidden bg-black"
          style={{ borderRadius: outerRadius - bezel }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={`${width}px`}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
