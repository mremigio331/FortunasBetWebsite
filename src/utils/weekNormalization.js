/**
 * Numeric normalization for the week contract.
 *
 * ESPN (and therefore `/bet/get_current_nfl_week`) can express `week_value` and
 * `season_type_value` as strings, while the selection controls and the
 * `weekOptions` dropdowns use numbers. Matching a resolved week to an option
 * with cross-type `===` silently fails and leaves the control blank, so every
 * value crossing that boundary is normalized to a number first.
 *
 * All functions here are pure: no clock reads, no mutation, no side effects.
 *
 * Requirements: 6.1 (normalize to the numeric type used by the controls),
 * 6.2/6.3 (match a resolved week to an option without cross-type strict equality).
 */

/**
 * Normalize a value to a finite number, or `null` when it cannot represent one.
 *
 * Handles the string/number duality of the ESPN payload. Booleans, objects,
 * empty/whitespace-only strings, `NaN`, and infinities all yield `null` rather
 * than a misleading `0`.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
export const toNumericValue = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Booleans, objects, arrays, functions: not week values.
  return null;
};

/**
 * Normalize a week value (`week_value`, a dropdown option value, ...) to a number.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
export const normalizeWeekValue = (value) => toNumericValue(value);

/**
 * Normalize a season-type value (`season_type_value`: 1 pre, 2 regular, 3 post).
 *
 * @param {unknown} value
 * @returns {number|null}
 */
export const normalizeSeasonTypeValue = (value) => toNumericValue(value);

/**
 * Normalize a season/calendar year value.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
export const normalizeYearValue = (value) => toNumericValue(value);

/**
 * Compare two week-ish values numerically instead of with cross-type `===`.
 *
 * `"12"` and `12` match; two non-numeric values never match (so a blank
 * selection can't accidentally equal a blank option).
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export const weekValuesMatch = (a, b) => {
  const left = toNumericValue(a);
  const right = toNumericValue(b);
  if (left === null || right === null) return false;
  return left === right;
};

const optionValueOf = (option) =>
  option !== null && typeof option === "object" ? option.value : option;

/**
 * Find the dropdown option matching a resolved week value, comparing numerically.
 *
 * Options may be primitives (`[1, 2, 3]`) or `{ value, label }` objects, and
 * either side may be a string.
 *
 * @param {Array<{value: unknown}|number|string>} options
 * @param {unknown} value
 * @returns {{value: unknown}|number|string|null} the matching option, else `null`
 */
export const findMatchingOption = (options, value) => {
  if (!Array.isArray(options)) return null;
  const target = toNumericValue(value);
  if (target === null) return null;

  const match = options.find(
    (option) => toNumericValue(optionValueOf(option)) === target,
  );
  return match === undefined ? null : match;
};

/**
 * Whether a resolved week value has a corresponding option (i.e. is in range).
 *
 * @param {Array<{value: unknown}|number|string>} options
 * @param {unknown} value
 * @returns {boolean}
 */
export const hasMatchingOption = (options, value) =>
  findMatchingOption(options, value) !== null;

/**
 * Normalize the Authoritative_Week_Source payload to the numeric shape the
 * selection state uses.
 *
 * Accepts the backend snake_case payload (`week_value`, `season_type_value`,
 * `season_year`) as well as an already-camelCase object, so the fallback source
 * can flow through the same normalization.
 *
 * @param {object|null|undefined} payload
 * @returns {{week: number|null, seasonType: number|null, year: number|null}|null}
 *   `null` when there is no payload at all.
 */
export const normalizeCurrentWeekPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  return {
    week: normalizeWeekValue(
      payload.week_value !== undefined ? payload.week_value : payload.week,
    ),
    seasonType: normalizeSeasonTypeValue(
      payload.season_type_value !== undefined
        ? payload.season_type_value
        : payload.seasonType,
    ),
    year: normalizeYearValue(
      payload.season_year !== undefined ? payload.season_year : payload.year,
    ),
  };
};

export default {
  toNumericValue,
  normalizeWeekValue,
  normalizeSeasonTypeValue,
  normalizeYearValue,
  weekValuesMatch,
  findMatchingOption,
  hasMatchingOption,
  normalizeCurrentWeekPayload,
};
