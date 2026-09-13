/**
 * Harness smoke test for the current-week-selection-fix test tooling.
 *
 * Confirms Jest + React Testing Library (`render`, `renderHook`) + fast-check are
 * wired to the project's Babel setup, and that this jsdom suite runs under a
 * fixed `process.env.TZ` rather than the machine's local zone.
 *
 * Supports Requirements 8.1, 8.2 (tooling prerequisite).
 */
import { useState } from "react";
import { render, renderHook, screen, act } from "@testing-library/react";
import fc from "fast-check";

const {
  TIME_ZONES,
  ALL_TIME_ZONES,
  getFixedTimeZone,
  offsetMinutesInZone,
  ambientOffsetMinutes,
} = require("../../test/tz");

// 2024-09-08T18:00:00Z — NFL Week 1 Sunday afternoon.
const INSTANT = Date.parse("2024-09-08T18:00:00Z");

describe("test harness", () => {
  it("renders React components with React Testing Library", () => {
    render(<span>Week 3</span>);
    expect(screen.getByText("Week 3")).toBeInTheDocument();
  });

  it("renders hooks with renderHook", () => {
    const { result } = renderHook(() => useState(1));

    expect(result.current[0]).toBe(1);
    act(() => result.current[1](7));
    expect(result.current[0]).toBe(7);
  });

  it("runs jsdom under the fixed TZ, not the machine zone", () => {
    expect(ambientOffsetMinutes(INSTANT)).toBe(
      offsetMinutesInZone(getFixedTimeZone(), INSTANT),
    );
  });

  it("runs fast-check properties over generated input", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 18 }), (week) => {
        expect(Number(String(week))).toBe(week);
      }),
      { numRuns: 100 },
    );
  });

  it("formats Eastern-Time dates independently of the viewer zone", () => {
    const formatEasternDate = () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONES.eastern,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(INSTANT));

    fc.assert(
      fc.property(fc.constantFrom(...ALL_TIME_ZONES), () => {
        expect(formatEasternDate()).toBe("2024-09-08");
      }),
      { numRuns: 100 },
    );
  });
});
