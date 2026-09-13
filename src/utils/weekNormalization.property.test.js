/**
 * Property-based coverage for the week-value normalization helpers.
 *
 * Feature: current-week-selection-fix, Property 8: For any week value and
 * season-type value returned by the Authoritative_Week_Source, whether
 * expressed as a string or a number, normalization SHALL yield the numeric
 * equivalent, and the normalized value SHALL match its corresponding dropdown
 * option without relying on cross-type strict equality.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
import fc from "fast-check";

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

/** NFL weeks span 1-18 regular season plus playoff rounds; 1-22 covers both. */
const WEEK_VALUES = { min: 1, max: 22 };
/** ESPN season types: 1 pre, 2 regular, 3 post. */
const SEASON_TYPE_VALUES = [1, 2, 3];

/**
 * The ways a single numeric value can arrive from the payload or an option:
 * as a number, as the string ESPN returns, or with incidental whitespace.
 */
const representationsOf = (value) =>
  fc.constantFrom(value, String(value), ` ${value}`, `${value} `, ` ${value} `);

/** Dropdown options are either primitives (`[1, 2]`) or `{ value, label }`. */
const optionArb = (value) =>
  fc.oneof(
    representationsOf(value),
    representationsOf(value).map((raw) => ({
      value: raw,
      label: `Week ${value}`,
    })),
  );

/** An options list that always contains `target`, in a random order. */
const optionsArb = (target, others) => {
  const values = [target, ...others.filter((other) => other !== target)];
  return fc.tuple(...values.map(optionArb)).chain((options) =>
    fc.shuffledSubarray(options, {
      minLength: options.length,
      maxLength: options.length,
    }),
  );
};

const rawValueOf = (option) =>
  option !== null && typeof option === "object" ? option.value : option;

const scenarioArb = fc
  .record({
    week: fc.integer(WEEK_VALUES),
    seasonType: fc.constantFrom(...SEASON_TYPE_VALUES),
    year: fc.integer({ min: 1999, max: 2100 }),
    otherWeeks: fc.uniqueArray(fc.integer(WEEK_VALUES), { maxLength: 6 }),
    // A week the room's options never cover, so matching can't be vacuously true.
    absentWeek: fc.integer({ min: 100, max: 500 }),
  })
  .chain(({ week, seasonType, year, otherWeeks, absentWeek }) =>
    fc.record({
      week: fc.constant(week),
      seasonType: fc.constant(seasonType),
      year: fc.constant(year),
      absentWeek: fc.constant(absentWeek),
      weekRep: representationsOf(week),
      seasonTypeRep: representationsOf(seasonType),
      yearRep: representationsOf(year),
      absentWeekRep: representationsOf(absentWeek),
      weekOptions: optionsArb(week, otherWeeks),
      seasonTypeOptions: optionsArb(
        seasonType,
        SEASON_TYPE_VALUES.filter((value) => value !== seasonType),
      ),
    }),
  );

describe("weekNormalization property 8", () => {
  it("normalizes string or numeric week values and matches them to their option without cross-type strict equality", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const {
          week,
          seasonType,
          year,
          absentWeek,
          weekRep,
          seasonTypeRep,
          yearRep,
          absentWeekRep,
          weekOptions,
          seasonTypeOptions,
        } = scenario;

        // 6.1: normalization yields the numeric equivalent of either representation.
        expect(normalizeWeekValue(weekRep)).toBe(week);
        expect(normalizeSeasonTypeValue(seasonTypeRep)).toBe(seasonType);
        expect(normalizeYearValue(yearRep)).toBe(year);

        // Normalization is idempotent: the numeric form survives a second pass.
        expect(toNumericValue(toNumericValue(weekRep))).toBe(week);

        // 6.1: the whole Authoritative_Week_Source payload normalizes to numbers.
        expect(
          normalizeCurrentWeekPayload({
            is_off_season: false,
            week_value: weekRep,
            season_type_value: seasonTypeRep,
            season_year: yearRep,
          }),
        ).toEqual({ week, seasonType, year });

        // 6.2/6.3: matching is numeric and symmetric, so it holds in the cases
        // where cross-type `===` would fail.
        expect(weekValuesMatch(weekRep, week)).toBe(true);
        expect(weekValuesMatch(week, weekRep)).toBe(true);
        expect(weekValuesMatch(seasonTypeRep, seasonType)).toBe(true);

        // 6.2/6.3: the resolved week finds its dropdown option regardless of
        // which side is a string.
        const matchedWeek = findMatchingOption(weekOptions, weekRep);
        expect(matchedWeek).not.toBeNull();
        expect(toNumericValue(rawValueOf(matchedWeek))).toBe(week);
        expect(hasMatchingOption(weekOptions, weekRep)).toBe(true);
        expect(hasMatchingOption(weekOptions, week)).toBe(true);

        const matchedSeasonType = findMatchingOption(
          seasonTypeOptions,
          seasonTypeRep,
        );
        expect(matchedSeasonType).not.toBeNull();
        expect(toNumericValue(rawValueOf(matchedSeasonType))).toBe(seasonType);

        // The match does not depend on strict equality: wherever the raw option
        // value and the resolved value differ by type, `===` says "no match"
        // while normalization still pairs them.
        const rawMatched = rawValueOf(matchedWeek);
        if (typeof rawMatched !== typeof weekRep) {
          expect(rawMatched === weekRep).toBe(false);
        }
        expect(
          weekOptions.some((option) => rawValueOf(option) === weekRep) ||
            weekValuesMatch(rawMatched, weekRep),
        ).toBe(true);

        // No false positives: a week the options don't cover stays unmatched, in
        // either representation, so out-of-range weeks are still detectable.
        expect(findMatchingOption(weekOptions, absentWeekRep)).toBeNull();
        expect(hasMatchingOption(weekOptions, absentWeek)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});
