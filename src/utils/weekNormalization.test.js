/**
 * Sanity coverage for the week-value normalization helpers.
 *
 * The exhaustive Property 8 coverage lives in the property test added by task
 * 6.3; this file pins the concrete string/number cases that made the dropdown
 * render blank.
 *
 * Requirements: 6.1, 6.2, 6.3
 */
import {
  findMatchingOption,
  hasMatchingOption,
  normalizeCurrentWeekPayload,
  normalizeSeasonTypeValue,
  normalizeWeekValue,
  normalizeYearValue,
  toNumericValue,
  weekValuesMatch,
} from "./weekNormalization";

describe("weekNormalization", () => {
  describe("toNumericValue", () => {
    it("passes finite numbers through", () => {
      expect(toNumericValue(3)).toBe(3);
      expect(toNumericValue(0)).toBe(0);
      expect(toNumericValue(-1)).toBe(-1);
    });

    it("parses the string form ESPN returns", () => {
      expect(toNumericValue("3")).toBe(3);
      expect(toNumericValue(" 18 ")).toBe(18);
    });

    it("returns null instead of a misleading 0 for non-values", () => {
      [
        null,
        undefined,
        "",
        "   ",
        "week 3",
        NaN,
        Infinity,
        true,
        {},
        [],
      ].forEach((input) => {
        expect(toNumericValue(input)).toBeNull();
      });
    });
  });

  describe("named normalizers", () => {
    it("normalize week, season type, and year alike", () => {
      expect(normalizeWeekValue("12")).toBe(12);
      expect(normalizeSeasonTypeValue("2")).toBe(2);
      expect(normalizeYearValue("2024")).toBe(2024);
      expect(normalizeWeekValue(null)).toBeNull();
    });
  });

  describe("weekValuesMatch", () => {
    it("matches across types where strict equality fails", () => {
      expect("2" === 2).toBe(false);
      expect(weekValuesMatch("2", 2)).toBe(true);
      expect(weekValuesMatch(2, "2")).toBe(true);
    });

    it("does not match different weeks or non-values", () => {
      expect(weekValuesMatch("2", 3)).toBe(false);
      expect(weekValuesMatch(null, null)).toBe(false);
      expect(weekValuesMatch(undefined, 1)).toBe(false);
      expect(weekValuesMatch("", "")).toBe(false);
    });
  });

  describe("findMatchingOption / hasMatchingOption", () => {
    const objectOptions = [
      { value: 1, label: "Week 1" },
      { value: 2, label: "Week 2" },
      { value: 3, label: "Week 3" },
    ];

    it("finds an option for a string-typed resolved week", () => {
      expect(findMatchingOption(objectOptions, "2")).toEqual({
        value: 2,
        label: "Week 2",
      });
      expect(hasMatchingOption(objectOptions, "2")).toBe(true);
    });

    it("supports primitive options and string-valued options", () => {
      expect(findMatchingOption([1, 2, 3], "3")).toBe(3);
      expect(findMatchingOption([{ value: "4" }], 4)).toEqual({ value: "4" });
    });

    it("reports out-of-range weeks rather than guessing", () => {
      expect(findMatchingOption(objectOptions, 9)).toBeNull();
      expect(hasMatchingOption(objectOptions, 9)).toBe(false);
      expect(findMatchingOption(objectOptions, null)).toBeNull();
      expect(findMatchingOption(null, 1)).toBeNull();
    });
  });

  describe("normalizeCurrentWeekPayload", () => {
    it("normalizes the snake_case backend payload to numbers", () => {
      expect(
        normalizeCurrentWeekPayload({
          is_off_season: false,
          season_year: "2024",
          season_type_value: "2",
          week_value: "3",
        }),
      ).toEqual({ week: 3, seasonType: 2, year: 2024 });
    });

    it("accepts an already-camelCase source (the fallback shape)", () => {
      expect(
        normalizeCurrentWeekPayload({ week: 5, seasonType: 2, year: 2024 }),
      ).toEqual({ week: 5, seasonType: 2, year: 2024 });
    });

    it("nulls out missing fields and returns null for no payload", () => {
      expect(normalizeCurrentWeekPayload({})).toEqual({
        week: null,
        seasonType: null,
        year: null,
      });
      expect(normalizeCurrentWeekPayload(null)).toBeNull();
      expect(normalizeCurrentWeekPayload(undefined)).toBeNull();
    });
  });
});
