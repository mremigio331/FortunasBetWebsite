/**
 * Sport-specific betting rules configuration.
 * Mirrors the backend SportConfig registry.
 */
const SPORT_BETTING_RULES = {
  NFL: {
    sportKey: "NFL",
    allowedPoints: [1, 2, 3],
    maxBetsPerWeek: 3,
    // Each point value can only be used once per week
    pointLimits: { 1: 1, 2: 1, 3: 1 },
    pointLabels: { 1: "1", 2: "2", 3: "3" },
    // NFL enforces unique point values per bet
    uniquePointsPerBet: true,
  },
  MLB: {
    sportKey: "MLB",
    allowedPoints: [1, 6],
    maxBetsPerWeek: 5,
    // 1-point bets: max 4 per week, 6-point "Big Bet": max 1 per week
    pointLimits: { 1: 4, 6: 1 },
    pointLabels: { 1: "1", 6: "Big Bet" },
    // MLB allows multiple bets with the same point value (up to limits)
    uniquePointsPerBet: false,
  },
};

/**
 * Get betting rules for a sport. Defaults to NFL for backward compatibility.
 * @param {string} sport - "NFL" or "MLB"
 * @returns {object} Sport betting rules
 */
export const getSportBettingRules = (sport) => {
  const key = (sport || "NFL").toUpperCase();
  return SPORT_BETTING_RULES[key] || SPORT_BETTING_RULES.NFL;
};

export default SPORT_BETTING_RULES;
