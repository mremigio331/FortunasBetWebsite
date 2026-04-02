import nflWeeks from "../constants/nflWeek";
import { truncateName } from "./textUtils";

/**
 * Look up the NFL week label for a unix-epoch timestamp (seconds).
 * Returns the week string (e.g. "Week 1") or "Unknown" if no match.
 */
function getWeekForDate(epochSeconds) {
  const gameDate = new Date(epochSeconds * 1000);
  const match = nflWeeks.find(
    (w) => new Date(w.start) <= gameDate && gameDate <= new Date(w.end),
  );
  return match ? match.week : "Unknown";
}

/**
 * Group an array of bet objects by week.
 *
 * Resolution order per bet:
 *  1. `bet.week` — used directly if present (string or number)
 *  2. `bet.event_datetime` — unix timestamp looked up against NFL week ranges
 *  3. Falls back to "Unknown"
 *
 * @param {Array} bets
 * @returns {Object} keyed by week (string|number) → array of bets
 */
export function groupBetsByWeek(bets) {
  const weeks = {};

  (bets || []).forEach((bet) => {
    let week;

    if (bet.week != null) {
      week = bet.week;
    } else if (bet.event_datetime) {
      week = getWeekForDate(bet.event_datetime);
    } else {
      week = "Unknown";
    }

    if (!weeks[week]) weeks[week] = [];
    weeks[week].push(bet);
  });

  return weeks;
}

/**
 * Aggregate an array of bets into per-user statistics.
 *
 * @param {Array}  bets      - Array of bet objects (each must have `user_id`)
 * @param {Object} usersMap  - Map of user_id → user profile objects
 * @returns {Array} Sorted (points descending) array of user stat objects:
 *   { user_id, user_name, user_color, total_bets, bets_won, points_total, bets }
 */
export function computeUserStats(bets, usersMap) {
  if (!bets || !Array.isArray(bets) || !usersMap) return [];

  const statsMap = {};

  bets.forEach((bet) => {
    const userId = bet.user_id;
    const profile = usersMap[userId] || {};

    if (!statsMap[userId]) {
      let userName =
        profile.user_name ||
        profile.name ||
        `User ${userId?.slice(-4) || "****"}`;
      if (userName.length > 20) {
        userName = truncateName(userName);
      }

      statsMap[userId] = {
        user_id: userId,
        user_name: userName,
        user_color: profile.user_color || "black",
        total_bets: 0,
        bets_won: 0,
        points_total: 0,
        bets: [],
      };
    }

    statsMap[userId].total_bets += 1;

    if (bet.total_points_earned && bet.total_points_earned > 0) {
      statsMap[userId].points_total += bet.total_points_earned;
    }

    if (bet.game_bet?.result === "win") {
      statsMap[userId].bets_won += 1;
    }

    statsMap[userId].bets.push(bet);
  });

  // Sort each user's bets by event_datetime descending
  Object.values(statsMap).forEach((userStat) => {
    userStat.bets.sort(
      (a, b) => (b.event_datetime || 0) - (a.event_datetime || 0),
    );
  });

  return Object.values(statsMap).sort(
    (a, b) => b.points_total - a.points_total,
  );
}
