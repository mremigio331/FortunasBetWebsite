/**
 * Coverage for the NFL Fallback_Week_Source.
 *
 * Two things are pinned here:
 *   1. boundaries are derived from the *actual* season start — the Thursday
 *      after Labor Day — not a fixed calendar day (Requirement 7.5)
 *   2. every classification is made against the **Eastern-Time** calendar date,
 *      so the answer never depends on the runtime's local zone
 *      (Requirements 3.1, 3.5)
 *
 * The whole file is timezone-sensitive by design. `npm test` pins `TZ=UTC`;
 * `npm run test:timezones` re-runs these same assertions under zones east of,
 * at, and west of Eastern Time. Identical expectations passing under every zone
 * is the timezone-invariance evidence.
 */
import {
  getCurrentNFLWeek,
  getDefaultNFLSelection,
  getNFLRegularSeasonStart,
  getNFLSeasonYear,
  isNFLSeason,
} from "./nflCurrentWeek";
import { getEasternDateParts } from "../utils/easternTime";

const { getFixedTimeZone } = require("../../test/tz");

const at = (iso) => Date.parse(iso);

describe("nflCurrentWeek (Fallback_Week_Source)", () => {
  it("runs under a fixed process.env.TZ", () => {
    expect(getFixedTimeZone()).toBe(process.env.TZ);
  });

  describe("getNFLRegularSeasonStart", () => {
    // Each of these is the real NFL kickoff Thursday, and each falls on a
    // different September date — a fixed calendar day cannot produce all three.
    it("returns the Thursday after Labor Day", () => {
      expect(getNFLRegularSeasonStart(2023)).toEqual({
        year: 2023,
        month: 9,
        day: 7,
      });
      expect(getNFLRegularSeasonStart(2024)).toEqual({
        year: 2024,
        month: 9,
        day: 5,
      });
      expect(getNFLRegularSeasonStart(2025)).toEqual({
        year: 2025,
        month: 9,
        day: 4,
      });
      expect(getNFLRegularSeasonStart(2026)).toEqual({
        year: 2026,
        month: 9,
        day: 10,
      });
    });

    it("always lands on a Thursday", () => {
      for (let seasonYear = 2015; seasonYear <= 2035; seasonYear += 1) {
        const { year, month, day } = getNFLRegularSeasonStart(seasonYear);
        expect(year).toBe(seasonYear);
        expect(month).toBe(9);
        // Thursday === 4, read via UTC accessors on a UTC-built date.
        expect(new Date(Date.UTC(year, month - 1, day)).getUTCDay()).toBe(4);
      }
    });
  });

  describe("getNFLSeasonYear", () => {
    it("treats August-December as the current season year", () => {
      expect(getNFLSeasonYear(at("2024-08-15T16:00:00Z"))).toBe(2024);
      expect(getNFLSeasonYear(at("2024-12-25T16:00:00Z"))).toBe(2024);
    });

    it("treats January-July as the prior season year", () => {
      expect(getNFLSeasonYear(at("2025-01-12T18:00:00Z"))).toBe(2024);
      expect(getNFLSeasonYear(at("2025-07-04T18:00:00Z"))).toBe(2024);
    });

    it("uses the ET calendar date at the month boundary", () => {
      // 02:00Z on Aug 1 is still 22:00 ET on Jul 31, so this is the 2023 season.
      expect(getNFLSeasonYear(at("2024-08-01T02:00:00Z"))).toBe(2023);
      // Later the same UTC day, ET has rolled over to Aug 1.
      expect(getNFLSeasonYear(at("2024-08-01T16:00:00Z"))).toBe(2024);
    });
  });

  describe("regular season", () => {
    it("puts kickoff Thursday in Week 1", () => {
      expect(getCurrentNFLWeek(at("2024-09-05T20:20:00-04:00"))).toEqual({
        seasonType: 2,
        week: 1,
        year: 2024,
        seasonName: "regular_season",
        displayName: "2024 Regular Season",
      });
    });

    it("advances a week every Thursday", () => {
      expect(getCurrentNFLWeek(at("2024-09-15T17:00:00Z")).week).toBe(2);
      expect(getCurrentNFLWeek(at("2024-09-19T17:00:00Z")).week).toBe(3);
      expect(getCurrentNFLWeek(at("2024-12-29T18:00:00Z")).week).toBe(17);
      expect(getCurrentNFLWeek(at("2025-01-05T18:00:00Z")).week).toBe(18);
    });

    it("rolls the week over on the ET boundary, not the UTC one", () => {
      // 02:00Z Thursday Sep 12 is still 22:00 ET Wednesday Sep 11 -> Week 1.
      expect(getCurrentNFLWeek(at("2024-09-12T02:00:00Z")).week).toBe(1);
      // Once ET reaches Sep 12, it is Week 2.
      expect(getCurrentNFLWeek(at("2024-09-12T13:00:00Z")).week).toBe(2);
    });

    it("tracks the shifted kickoff in the following season", () => {
      // 2025 kicks off Sep 4, a day earlier than 2024 did.
      expect(getCurrentNFLWeek(at("2025-09-04T20:00:00-04:00"))).toMatchObject({
        seasonType: 2,
        week: 1,
        year: 2025,
      });
      // Sep 5 2024 was Week 1; the same calendar day in 2025 is Week 1 too,
      // but Sep 11 differs because the seasons start on different dates.
      expect(getCurrentNFLWeek(at("2025-09-11T17:00:00Z")).week).toBe(2);
      expect(getCurrentNFLWeek(at("2024-09-11T17:00:00Z")).week).toBe(1);
    });
  });

  describe("preseason", () => {
    it("starts four weeks before kickoff", () => {
      // 2024 kickoff is Sep 5, so preseason opens Aug 8.
      expect(getCurrentNFLWeek(at("2024-08-08T17:00:00Z"))).toEqual({
        seasonType: 1,
        week: 1,
        year: 2024,
        seasonName: "preseason",
        displayName: "2024 Preseason",
      });
      expect(getCurrentNFLWeek(at("2024-08-15T17:00:00Z")).week).toBe(2);
      expect(getCurrentNFLWeek(at("2024-09-04T17:00:00Z"))).toMatchObject({
        seasonType: 1,
        week: 4,
      });
    });
  });

  describe("postseason", () => {
    it("resolves the January playoff window to the prior season year", () => {
      // Wild card weekend of the 2024 season.
      expect(getCurrentNFLWeek(at("2025-01-12T18:00:00Z"))).toEqual({
        seasonType: 3,
        week: 1,
        year: 2024,
        seasonName: "postseason",
        displayName: "2024 Playoffs",
      });
    });

    it("covers the rounds through the Super Bowl", () => {
      expect(getCurrentNFLWeek(at("2025-01-19T18:00:00Z")).week).toBe(2);
      expect(getCurrentNFLWeek(at("2025-01-26T18:00:00Z")).week).toBe(3);
      // Super Bowl LIX, Feb 9 2025 — still inside the postseason window.
      expect(getCurrentNFLWeek(at("2025-02-09T23:30:00Z"))).toMatchObject({
        seasonType: 3,
        year: 2024,
      });
    });
  });

  describe("off-season", () => {
    it("points at the upcoming season before preseason opens", () => {
      expect(getCurrentNFLWeek(at("2024-08-07T17:00:00Z"))).toEqual({
        seasonType: 2,
        week: 1,
        year: 2024,
        seasonName: "regular_season",
        displayName: "2024 Regular Season",
        isOffSeason: true,
      });
    });

    it("points at the next season once the Super Bowl has passed", () => {
      // March 2025 belongs to Season_Year 2024, but the next season is 2025.
      expect(getCurrentNFLWeek(at("2025-03-01T17:00:00Z"))).toMatchObject({
        year: 2025,
        week: 1,
        seasonType: 2,
        isOffSeason: true,
      });
      expect(getCurrentNFLWeek(at("2025-06-15T17:00:00Z")).year).toBe(2025);
    });
  });

  describe("getDefaultNFLSelection", () => {
    it("returns numeric selection values for an in-season instant", () => {
      expect(getDefaultNFLSelection(at("2024-09-15T17:00:00Z"))).toEqual({
        year: 2024,
        seasonType: 2,
        week: 2,
        isCurrentWeek: true,
        isOffSeason: false,
        displayText: "2024 Regular Season",
      });
    });

    it("flags off-season instants", () => {
      expect(getDefaultNFLSelection(at("2025-03-01T17:00:00Z"))).toMatchObject({
        isCurrentWeek: false,
        isOffSeason: true,
      });
    });

    it("works with no argument (the shape useCurrentWeek consumes)", () => {
      const selection = getDefaultNFLSelection();
      expect(typeof selection.year).toBe("number");
      expect(typeof selection.seasonType).toBe("number");
      expect(typeof selection.week).toBe("number");
      expect(typeof selection.isCurrentWeek).toBe("boolean");
    });

    it("falls back to now for an unusable instant instead of throwing", () => {
      expect(getDefaultNFLSelection("not-a-date")).toEqual(
        getDefaultNFLSelection(),
      );
    });
  });

  describe("isNFLSeason", () => {
    it("is true inside the season and false outside it", () => {
      expect(isNFLSeason(at("2024-09-15T17:00:00Z"))).toBe(true);
      expect(isNFLSeason(at("2025-01-12T18:00:00Z"))).toBe(true);
      expect(isNFLSeason(at("2025-03-01T17:00:00Z"))).toBe(false);
    });
  });

  describe("depends only on the Eastern-Time calendar date", () => {
    /**
     * Noon UTC is 07:00/08:00 ET, so it is always the same ET calendar date as
     * the instant it was derived from — but a very different local date/time in
     * most zones. If any local date accessor leaked back into the boundary
     * math, these two calls would disagree somewhere across the sweep.
     */
    const noonUtcOfEasternDate = (instant) => {
      const { year, month, day } = getEasternDateParts(instant);
      return Date.UTC(year, month - 1, day, 12);
    };

    it("classifies every instant of three seasons identically to noon UTC of its ET date", () => {
      const start = Date.UTC(2023, 6, 1); // 2023-07-01
      const end = Date.UTC(2026, 2, 1); // 2026-03-01
      const hoursUtc = [0, 3, 4, 5, 12, 23];
      let comparisons = 0;

      for (let day = start; day <= end; day += 86400000) {
        hoursUtc.forEach((hour) => {
          const instant = day + hour * 3600000;
          expect(getCurrentNFLWeek(instant)).toEqual(
            getCurrentNFLWeek(noonUtcOfEasternDate(instant)),
          );
          comparisons += 1;
        });
      }

      expect(comparisons).toBeGreaterThan(5000);
    });
  });
});
