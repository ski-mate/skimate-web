/**
 * One image, with everything next/image needs and nothing it does not.
 *
 * `blurDataURL` is a real 16px encode of the source, written in by
 * scripts/encode-media.mjs — not a solid colour, so the placeholder already
 * carries the composition and the swap is barely visible.
 */
export interface Media {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
  /**
   * CSS object-position for photographs cropped into a band. Defaults to
   * centre; set it when the subject does not sit in the middle of the frame.
   */
  position?: string;
}
