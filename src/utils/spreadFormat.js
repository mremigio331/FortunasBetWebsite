// Single source of truth for turning ESPN-style odds (a spread magnitude/sign
// plus a `favoredTeam`) into the signed point-spread line shown for a given
// side of a game. All bet-placement and bet-display surfaces should format
// spreads through these helpers so the number a user sees is always consistent
// (favorite negative, underdog positive) regardless of how the raw snapshot
// stored the sign.

/**
 * Resolve which side ("home" | "away") is favored.
 *
 * Prefers an explicit `favoredTeam` from the odds snapshot. When that's
 * missing, infers it from the raw spread sign using ESPN's home-relative
 * convention: a negative `spread` means the home team is favored, positive
 * means the away team is favored. Returns null for a pick'em / unknown.
 *
 * @param {("home"|"away"|string|null|undefined)} favoredTeam
 * @param {number|string|null|undefined} rawSpread
 * @returns {("home"|"away"|null)}
 */
export function resolveFavoredSide(favoredTeam, rawSpread) {
  if (favoredTeam === "home" || favoredTeam === "away") return favoredTeam;
  const num = Number(rawSpread);
  if (Number.isNaN(num) || num === 0) return null;
  return num < 0 ? "home" : "away";
}

/**
 * Compute the signed line for one side of a game.
 *
 * The favorite gets `-|spread|`, the underdog gets `+|spread|`, and a pick'em
 * (zero/absent magnitude) is 0. Returns null when there's no usable spread.
 *
 * @param {("home"|"away")} side
 * @param {object} params
 * @param {number|string|null|undefined} params.spread - raw spread magnitude/sign
 * @param {("home"|"away"|string|null|undefined)} params.favoredTeam
 * @returns {number|null} signed line, or null when no spread is available
 */
export function signedLineForSide(side, { spread, favoredTeam } = {}) {
  if (spread === null || spread === undefined || spread === "") return null;
  const magnitude = Math.abs(Number(spread));
  if (Number.isNaN(magnitude)) return null;
  if (magnitude === 0) return 0;

  const favored = resolveFavoredSide(favoredTeam, spread);
  if (favored == null) return magnitude; // pick'em-ish: no favorite known
  return side === favored ? -magnitude : magnitude;
}

/**
 * Format a signed line as a display string: "-3.5", "+3.5", "PK" for zero,
 * or "TBD" when the line is unavailable.
 *
 * @param {number|null|undefined} line
 * @returns {string}
 */
export function formatLine(line) {
  if (line === null || line === undefined || Number.isNaN(Number(line))) {
    return "TBD";
  }
  const num = Number(line);
  const rounded = Math.round(num * 10) / 10;
  if (rounded === 0) return "PK";
  const absStr =
    Math.abs(rounded) % 1 !== 0
      ? Math.abs(rounded).toFixed(1)
      : String(Math.abs(rounded));
  return rounded > 0 ? `+${absStr}` : `-${absStr}`;
}

/**
 * Convenience: signed display string for one side straight from odds fields.
 *
 * @param {("home"|"away")} side
 * @param {object} odds - object with `spread` and `favoredTeam`
 * @returns {string}
 */
export function formatSpreadForSide(side, odds = {}) {
  return formatLine(
    signedLineForSide(side, {
      spread: odds.spread,
      favoredTeam: odds.favoredTeam,
    }),
  );
}

/**
 * Format the spread for an already-placed bet, using the persisted
 * `spread_value` when present (that's the exact line locked in at bet time),
 * otherwise deriving from the snapshot's `spread` + `favoredTeam` for the
 * chosen team. Returns "TBD" when nothing usable is available.
 *
 * @param {object} bet - a stored bet ({ game_bet, odds_snapshot })
 * @returns {string}
 */
export function formatPlacedBetSpread(bet) {
  if (!bet || !bet.game_bet) return "TBD";
  const stored = bet.game_bet.spread_value;
  if (
    stored !== null &&
    stored !== undefined &&
    !Number.isNaN(Number(stored))
  ) {
    return formatLine(Number(stored));
  }
  const teamChoice = bet.game_bet.team_choice;
  if (teamChoice !== "home" && teamChoice !== "away") return "TBD";
  const snap = bet.odds_snapshot || {};
  return formatLine(
    signedLineForSide(teamChoice, {
      spread: snap.spread,
      favoredTeam: snap.favoredTeam,
    }),
  );
}

export default formatSpreadForSide;
