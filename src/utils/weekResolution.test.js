/**
 * @jest-environment node
 */

/**
 * Sanity coverage for the shared Week Resolution algorithm.
 *
 * The exhaustive ordering guarantee is Property 6's property-based test; these
 * examples pin the branch behaviour and the NFL/MLB equivalence that the
 * selection hooks depend on.
 *
 * Supports Requirements 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 6.4.
 */
import {
  WEEK_MATCH,
  normalizeWeekRange,
  resolveWeekSelection,
  toEpochSeconds,
  toWeekIdentity,
} from "./weekResolution";

// Three consecutive Mon-Sun ET weeks, epoch seconds.
const WEEK_1_START = Date.parse("2024-09-02T04:00:00Z") / 1000; // Mon 00:00 EDT
const WEEK_LENGTH = 7 * 24 * 60 * 60;

const mlbWeek = (weekNumber) => ({
  week: weekNumber,
  start: WEEK_1_START + (weekNumber - 1) * WEEK_LENGTH,
  end: WEEK_1_START + weekNumber * WEEK_LENGTH - 1,
  label: `Week ${weekNumber}`,
});

const MLB_RANGE = [mlbWeek(1), mlbWeek(2), mlbWeek(3)];

// Same three periods expressed in the NFL wire shape.
const NFL_RANGE = MLB_RANGE.map((week) => ({
  year: 2024,
  season_type: 2,
  season_name: "regular_season",
  week: week.week,
  week_start_epoch: week.start,
  week_end_epoch: week.end,
}));

const insideWeek = (weekNumber) => mlbWeek(weekNumber).start + 3 * 60 * 60;

describe("normalizeWeekRange", () => {
  it("normalizes both wire shapes to the same boundaries", () => {
    expect(
      normalizeWeekRange(MLB_RANGE).map((w) => [w.week, w.start, w.end]),
    ).toEqual(
      normalizeWeekRange(NFL_RANGE).map((w) => [w.week, w.start, w.end]),
    );
  });

  it("sorts chronologically and drops unusable entries", () => {
    const normalized = normalizeWeekRange([
      mlbWeek(3),
      mlbWeek(1),
      { week: 9 }, // no boundaries
      { week: 9, start: 100, end: 50 }, // inverted
      null,
    ]);

    expect(normalized.map((w) => w.week)).toEqual([1, 3]);
  });

  it("accepts numeric strings from the wire", () => {
    const [week] = normalizeWeekRange([
      { week: "2", season_type: "3", year: "2024", start: "100", end: "200" },
    ]);

    expect(week).toMatchObject({
      week: 2,
      seasonType: 3,
      year: 2024,
      start: 100,
      end: 200,
    });
  });
});

describe("toWeekIdentity", () => {
  it("reads either naming convention", () => {
    expect(
      toWeekIdentity({
        week_value: "5",
        season_type_value: "2",
        season_year: 2024,
      }),
    ).toEqual({ week: 5, seasonType: 2, year: 2024 });
  });

  it("treats an off-season payload of nulls as no identity", () => {
    expect(
      toWeekIdentity({
        is_off_season: true,
        week_value: null,
        season_type_value: null,
        season_year: null,
      }),
    ).toBeNull();
  });
});

describe("resolveWeekSelection ordering", () => {
  it("selects the week containing the present moment", () => {
    const result = resolveWeekSelection({
      weeks: MLB_RANGE,
      now: insideWeek(2),
    });

    expect(result.selection.week).toBe(2);
    expect(result.matchedBy).toBe(WEEK_MATCH.CONTAINING);
    expect(result.isCurrentWeekInRange).toBe(true);
    expect(result.isCurrentWeekOutOfRange).toBe(false);
  });

  it("selects the nearest upcoming week when the range is entirely ahead", () => {
    const result = resolveWeekSelection({
      weeks: MLB_RANGE,
      now: WEEK_1_START - 60,
    });

    expect(result.selection.week).toBe(1);
    expect(result.matchedBy).toBe(WEEK_MATCH.UPCOMING);
    expect(result.isCurrentWeekOutOfRange).toBe(true);
  });

  it("selects the nearest upcoming week from a gap between weeks", () => {
    const gapped = [mlbWeek(1), mlbWeek(3)];
    const result = resolveWeekSelection({
      weeks: gapped,
      now: insideWeek(2),
    });

    expect(result.selection.week).toBe(3);
    expect(result.matchedBy).toBe(WEEK_MATCH.UPCOMING);
  });

  it("selects the most recent past week when the range is entirely behind", () => {
    const result = resolveWeekSelection({
      weeks: MLB_RANGE,
      now: mlbWeek(3).end + 60,
    });

    expect(result.selection.week).toBe(3);
    expect(result.matchedBy).toBe(WEEK_MATCH.PAST);
    expect(result.isCurrentWeekOutOfRange).toBe(true);
  });

  it("never selects a week outside the supplied range", () => {
    [
      WEEK_1_START - 10 * WEEK_LENGTH,
      insideWeek(2),
      mlbWeek(3).end + WEEK_LENGTH,
    ].forEach((now) => {
      const { selectedWeek, weeks } = resolveWeekSelection({
        weeks: MLB_RANGE,
        now,
      });
      expect(weeks).toContain(selectedWeek);
    });
  });

  it("returns no selection for an empty range", () => {
    const result = resolveWeekSelection({ weeks: [], now: insideWeek(1) });

    expect(result.selectedWeek).toBeNull();
    expect(result.hasRange).toBe(false);
    expect(result.isCurrentWeekOutOfRange).toBe(false);
  });
});

describe("resolveWeekSelection and the reported Current_Week", () => {
  it("selects the reported current week when the range covers it", () => {
    const result = resolveWeekSelection({
      weeks: NFL_RANGE,
      now: insideWeek(1),
      currentWeek: {
        week_value: "3",
        season_type_value: "2",
        season_year: 2024,
      },
    });

    expect(result.selection).toEqual({ week: 3, seasonType: 2, year: 2024 });
    expect(result.matchedBy).toBe(WEEK_MATCH.AUTHORITATIVE);
    expect(result.isCurrentWeekOutOfRange).toBe(false);
  });

  it("flags out-of-range and clamps when the range does not cover it", () => {
    const result = resolveWeekSelection({
      weeks: NFL_RANGE,
      now: insideWeek(2),
      currentWeek: { week_value: 12, season_type_value: 2, season_year: 2024 },
    });

    expect(result.selection.week).toBe(2); // nearest in-range week
    expect(result.isCurrentWeekInRange).toBe(false);
    expect(result.isCurrentWeekOutOfRange).toBe(true);
  });

  it("ignores the reported week when preferCurrentWeek is off", () => {
    const result = resolveWeekSelection({
      weeks: NFL_RANGE,
      now: insideWeek(1),
      currentWeek: { week_value: 3, season_type_value: 2, season_year: 2024 },
      preferCurrentWeek: false,
    });

    expect(result.selection.week).toBe(1);
    expect(result.matchedBy).toBe(WEEK_MATCH.CONTAINING);
  });
});

describe("NFL and MLB equivalence", () => {
  it("returns the same selection for equivalent inputs", () => {
    [
      insideWeek(1),
      insideWeek(3),
      WEEK_1_START - 60,
      mlbWeek(3).end + 60,
    ].forEach((now) => {
      const mlb = resolveWeekSelection({ weeks: MLB_RANGE, now });
      const nfl = resolveWeekSelection({ weeks: NFL_RANGE, now });

      expect(nfl.selection.week).toBe(mlb.selection.week);
      expect(nfl.matchedBy).toBe(mlb.matchedBy);
      expect(nfl.selectedWeek.start).toBe(mlb.selectedWeek.start);
      expect(nfl.selectedWeek.end).toBe(mlb.selectedWeek.end);
    });
  });
});

describe("timezone invariance", () => {
  it("compares absolute instants, so the ambient zone cannot shift the result", () => {
    const now = insideWeek(2);
    const result = resolveWeekSelection({ weeks: MLB_RANGE, now });

    // Same instant, expressed via a Date built from the ambient zone.
    const viaDate = resolveWeekSelection({
      weeks: MLB_RANGE,
      now: toEpochSeconds(new Date(now * 1000).getTime()),
    });

    expect(viaDate.selection).toEqual(result.selection);
    expect(viaDate.matchedBy).toBe(result.matchedBy);
  });
});
