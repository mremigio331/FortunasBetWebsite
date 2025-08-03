/**
 * NFL Current Week Detection Utilities
 * Determines the current NFL week and season based on the current date
 */

import { getSeasonType } from "./nflSeasonTypes";

/**
 * NFL Season dates structure
 * These are approximate dates and may need adjustment based on actual NFL schedule
 */
const NFL_SEASON_STRUCTURE = {
  // Preseason typically starts in early August
  PRESEASON_START: { month: 8, day: 1 },
  PRESEASON_END: { month: 8, day: 31 },

  // Regular season typically starts first week of September
  REGULAR_SEASON_START: { month: 9, day: 1 },
  REGULAR_SEASON_END: { month: 1, day: 7 }, // Next year

  // Playoffs typically start second week of January
  PLAYOFFS_START: { month: 1, day: 8 },
  PLAYOFFS_END: { month: 2, day: 14 },
};

/**
 * Get the NFL season year for a given date
 * NFL season year is based on when the season starts (September)
 * @param {Date} date - The date to check
 * @returns {number} The NFL season year
 */
export const getNFLSeasonYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed

  // If it's January-July, it's still the previous season
  if (month <= 7) {
    return year - 1;
  }

  return year;
};

/**
 * Determine current NFL season type and week based on date
 * @param {Date} date - The date to check (defaults to current date)
 * @returns {object} Object with seasonType, week, year, and seasonName
 */
export const getCurrentNFLWeek = (date = new Date()) => {
  const now = date;
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() is 0-indexed
  const day = now.getDate();
  const seasonYear = getNFLSeasonYear(now);

  // Helper function to create date for comparison
  const createSeasonDate = (seasonYear, monthDay, isNextYear = false) => {
    const targetYear = isNextYear ? seasonYear + 1 : seasonYear;
    return new Date(targetYear, monthDay.month - 1, monthDay.day);
  };

  // Season boundaries for the current NFL season year
  const preseasonStart = createSeasonDate(
    seasonYear,
    NFL_SEASON_STRUCTURE.PRESEASON_START,
  );
  const preseasonEnd = createSeasonDate(
    seasonYear,
    NFL_SEASON_STRUCTURE.PRESEASON_END,
  );
  const regularSeasonStart = createSeasonDate(
    seasonYear,
    NFL_SEASON_STRUCTURE.REGULAR_SEASON_START,
  );
  const regularSeasonEnd = createSeasonDate(
    seasonYear,
    NFL_SEASON_STRUCTURE.REGULAR_SEASON_END,
    true,
  );
  const playoffsStart = createSeasonDate(
    seasonYear,
    NFL_SEASON_STRUCTURE.PLAYOFFS_START,
    true,
  );
  const playoffsEnd = createSeasonDate(
    seasonYear,
    NFL_SEASON_STRUCTURE.PLAYOFFS_END,
    true,
  );

  // Determine season type and approximate week
  if (now >= preseasonStart && now <= preseasonEnd) {
    // Preseason (4 weeks in August)
    const weeksFromStart =
      Math.floor((now - preseasonStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      seasonType: 1,
      week: Math.min(Math.max(weeksFromStart, 1), 4),
      year: seasonYear,
      seasonName: "preseason",
      displayName: `${seasonYear} Preseason`,
    };
  } else if (now >= regularSeasonStart && now <= regularSeasonEnd) {
    // Regular season (18 weeks from September to early January)
    const weeksFromStart =
      Math.floor((now - regularSeasonStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      seasonType: 2,
      week: Math.min(Math.max(weeksFromStart, 1), 18),
      year: seasonYear,
      seasonName: "regular_season",
      displayName: `${seasonYear} Regular Season`,
    };
  } else if (now >= playoffsStart && now <= playoffsEnd) {
    // Playoffs (4 weeks in January/February)
    const weeksFromStart =
      Math.floor((now - playoffsStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      seasonType: 3,
      week: Math.min(Math.max(weeksFromStart, 1), 4),
      year: seasonYear,
      seasonName: "postseason",
      displayName: `${seasonYear} Playoffs`,
    };
  } else {
    // Off-season - default to upcoming regular season
    const upcomingSeasonYear = month >= 8 ? year : year - 1;
    return {
      seasonType: 2,
      week: 1,
      year: upcomingSeasonYear,
      seasonName: "regular_season",
      displayName: `${upcomingSeasonYear} Regular Season`,
      isOffSeason: true,
    };
  }
};

/**
 * Get default NFL selection for the application
 * Uses current week if in season, otherwise defaults to upcoming season
 * @returns {object} Default selection with year, seasonType, and week
 */
export const getDefaultNFLSelection = () => {
  const current = getCurrentNFLWeek();

  return {
    year: current.year,
    seasonType: current.seasonType,
    week: current.week,
    isCurrentWeek: !current.isOffSeason,
    displayText: current.displayName,
  };
};

/**
 * Check if a given date is during NFL season
 * @param {Date} date - The date to check
 * @returns {boolean} True if during NFL season (preseason, regular, or playoffs)
 */
export const isNFLSeason = (date = new Date()) => {
  const current = getCurrentNFLWeek(date);
  return !current.isOffSeason;
};

/**
 * Get the next NFL game week
 * @param {Date} date - The date to check from
 * @returns {object} Next game week information
 */
export const getNextNFLWeek = (date = new Date()) => {
  const current = getCurrentNFLWeek(date);

  if (current.isOffSeason) {
    return current; // Already returns the next season
  }

  // If in season, return next week or next season if at end
  const seasonType = getSeasonType(current.seasonType);
  const maxWeeks = seasonType?.maxWeeks || 18;

  if (current.week < maxWeeks) {
    return {
      ...current,
      week: current.week + 1,
    };
  } else {
    // Move to next season type or off-season
    if (current.seasonType === 1) {
      // Preseason -> Regular
      return {
        ...current,
        seasonType: 2,
        week: 1,
        seasonName: "regular_season",
        displayName: `${current.year} Regular Season`,
      };
    } else if (current.seasonType === 2) {
      // Regular -> Playoffs
      return {
        ...current,
        seasonType: 3,
        week: 1,
        seasonName: "postseason",
        displayName: `${current.year} Playoffs`,
      };
    } else {
      // Playoffs -> Next year preseason
      return {
        seasonType: 1,
        week: 1,
        year: current.year + 1,
        seasonName: "preseason",
        displayName: `${current.year + 1} Preseason`,
      };
    }
  }
};

export default {
  getCurrentNFLWeek,
  getDefaultNFLSelection,
  getNFLSeasonYear,
  isNFLSeason,
  getNextNFLWeek,
};
