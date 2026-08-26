import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  BOTTOM_TOLERANCE_PX,
  distanceFromBottom,
  isAtBottom,
  type ScrollGeometry,
} from "@/lib/autoscroll";

/** A 400px-tall viewport holding `contentHeight` of transcript, scrolled to `scrollTop`. */
const viewport = (contentHeight: number, scrollTop: number): ScrollGeometry => ({
  clientHeight: 400,
  scrollHeight: contentHeight,
  scrollTop,
});

describe("distanceFromBottom", () => {
  test("measures the unread transcript below the fold", () => {
    assert.equal(distanceFromBottom(viewport(1000, 200)), 400);
  });

  test("is zero when the viewport is scrolled all the way down", () => {
    assert.equal(distanceFromBottom(viewport(1000, 600)), 0);
  });

  test("is negative when the transcript is shorter than the viewport", () => {
    assert.equal(distanceFromBottom(viewport(120, 0)), -280);
  });
});

describe("isAtBottom", () => {
  test("holds the pin at the exact bottom", () => {
    assert.equal(isAtBottom(viewport(1000, 600)), true);
  });

  test("holds the pin for a transcript too short to scroll", () => {
    assert.equal(isAtBottom(viewport(120, 0)), true);
  });

  test("holds the pin through sub-pixel scroll geometry", () => {
    assert.equal(isAtBottom(viewport(1000.5, 600.1)), true);
  });

  test("holds the pin exactly at the tolerance", () => {
    assert.equal(isAtBottom(viewport(1000, 600 - BOTTOM_TOLERANCE_PX)), true);
  });

  test("releases the pin one pixel past the tolerance", () => {
    assert.equal(isAtBottom(viewport(1000, 600 - BOTTOM_TOLERANCE_PX - 1)), false);
  });

  test("releases the pin when the user has scrolled well up", () => {
    assert.equal(isAtBottom(viewport(1000, 100)), false);
  });

  test("honours a caller-supplied tolerance", () => {
    const scrolledUp100 = viewport(1000, 500);
    assert.equal(isAtBottom(scrolledUp100, 200), true);
    assert.equal(isAtBottom(scrolledUp100, 50), false);
  });
});

describe("following a live stream", () => {
  /**
   * The pin is sampled on user scrolls only. Resampling right after the
   * transcript grows would always read false — the new content is exactly the
   * distance that just opened up — so a growth step here deliberately reports
   * no sample at all.
   */
  test("stays pinned while streamed tokens keep growing the transcript", () => {
    let contentHeight = 500;
    let scrollTop = 100;
    let pinned = isAtBottom(viewport(contentHeight, scrollTop));
    assert.equal(pinned, true);

    for (const grown of [700, 900, 1100]) {
      contentHeight = grown;
      // The observer scrolls to the bottom, which fires the scroll it samples.
      scrollTop = contentHeight - 400;
      pinned = isAtBottom(viewport(contentHeight, scrollTop));
      assert.equal(pinned, true);
    }
  });

  test("releases when the user scrolls up mid-stream, and re-pins at the bottom", () => {
    assert.equal(isAtBottom(viewport(1100, 700)), true);

    // User drags back through the transcript while tokens are still arriving.
    assert.equal(isAtBottom(viewport(1100, 300)), false);

    // More tokens land under them; still released, and further from the bottom.
    assert.equal(isAtBottom(viewport(1600, 300)), false);

    // Scrolling back down re-pins for the rest of the stream.
    assert.equal(isAtBottom(viewport(1600, 1200)), true);
  });

  test("a sample taken straight after growth would read as released", () => {
    assert.equal(isAtBottom(viewport(1000, 600)), true);
    assert.equal(isAtBottom(viewport(1400, 600)), false);
  });
});
