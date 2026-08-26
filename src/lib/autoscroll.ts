/**
 * The scroll geometry autoscroll reads. `HTMLElement` satisfies it
 * structurally, so the chat panel passes the real viewport and tests pass a
 * plain object — no DOM shim in between.
 */
export interface ScrollGeometry {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

/**
 * Browsers report fractional `scrollHeight`/`clientHeight` under zoom and
 * fractional device pixel ratios, so a viewport scrolled fully to the bottom
 * routinely lands a pixel or two short of the arithmetic bottom. The
 * tolerance also keeps a small deliberate nudge from unpinning the stream.
 */
export const BOTTOM_TOLERANCE_PX = 24;

export const distanceFromBottom = (geometry: ScrollGeometry): number =>
  geometry.scrollHeight - geometry.scrollTop - geometry.clientHeight;

/**
 * Whether the viewport is close enough to the bottom to keep following new
 * content.
 *
 * Sample this on *user* scrolls only. Recomputing it right after the
 * transcript grows would always report false — the new content is precisely
 * the distance that just opened up below — and autoscroll would release
 * itself on the first streamed token.
 */
export const isAtBottom = (
  geometry: ScrollGeometry,
  tolerance: number = BOTTOM_TOLERANCE_PX,
): boolean => distanceFromBottom(geometry) <= tolerance;
