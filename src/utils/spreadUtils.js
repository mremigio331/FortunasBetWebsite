// Utility for computing displayed spread strings relative to a user's pick
// Input: bet object (shape used in RoomBetsDisplay)
// Output: string like '+8.5', '-3', or 'TBD'
export function computeDisplayedSpread(bet) {
  if (!bet) return "TBD";
  const raw = bet.game_bet?.spread_value ?? bet.odds_snapshot?.spread;
  if (raw === null || raw === undefined) return "TBD";
  const spreadNum = parseFloat(raw);
  if (Number.isNaN(spreadNum)) return "TBD";
  // Determine favored team: prefer explicit field from snapshot, otherwise infer from sign
  const favored = bet.odds_snapshot?.favoredTeam
    ? bet.odds_snapshot.favoredTeam.toLowerCase()
    : spreadNum < 0
      ? "home"
      : spreadNum > 0
        ? "away"
        : null;

  const teamChoice = bet.game_bet?.team_choice;
  const magnitude = Math.abs(spreadNum);

  let finalSigned;

  if (teamChoice) {
    // If the user picked a team, show negative for the favorite and positive for the underdog
    if (favored) {
      finalSigned = teamChoice === favored ? -magnitude : magnitude;
    } else {
      // fallback: infer favored from raw sign
      const inferredFav =
        spreadNum < 0 ? "home" : spreadNum > 0 ? "away" : null;
      finalSigned =
        inferredFav && teamChoice === inferredFav ? -magnitude : magnitude;
    }
  } else {
    // No team choice: return the snapshot spread sign (use magnitude with snapshot sign)
    finalSigned = spreadNum < 0 ? -magnitude : magnitude;
  }

  // Format result: include '+' for positive, '-' for negative, omit sign for zero
  const formatted = Math.round(finalSigned * 10) / 10;
  const absStr =
    Math.abs(formatted) % 1 !== 0
      ? Math.abs(formatted).toFixed(1)
      : String(Math.abs(formatted));
  if (formatted > 0) return `+${absStr}`;
  if (formatted < 0) return `-${absStr}`;
  return absStr;
}

export default computeDisplayedSpread;
