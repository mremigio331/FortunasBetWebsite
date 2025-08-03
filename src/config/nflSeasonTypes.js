/**
 * NFL Season Type Configuration
 * Maps numeric season type codes to their descriptive information
 */

export const NFL_SEASON_TYPES = {
  1: {
    id: 1,
    name: "preseason",
    displayName: "Preseason",
    shortName: "PRE",
    description: "NFL Preseason games",
    maxWeeks: 4,
    color: "#52c41a", // green
    icon: "🏈",
  },
  2: {
    id: 2,
    name: "regular_season",
    displayName: "Regular Season",
    shortName: "REG",
    description: "NFL Regular Season games",
    maxWeeks: 18,
    color: "#1890ff", // blue
    icon: "🏆",
  },
  3: {
    id: 3,
    name: "postseason",
    displayName: "Playoffs",
    shortName: "POST",
    description: "NFL Playoff games",
    maxWeeks: 4,
    color: "#f5222d", // red
    icon: "🥇",
  },
};

/**
 * Get season type information by ID
 * @param {number} seasonTypeId - The season type ID (1, 2, or 3)
 * @returns {object|null} Season type object or null if not found
 */
export const getSeasonType = (seasonTypeId) => {
  return NFL_SEASON_TYPES[seasonTypeId] || null;
};

/**
 * Get display name for season type
 * @param {number} seasonTypeId - The season type ID
 * @returns {string} Display name or 'Unknown'
 */
export const getSeasonTypeDisplayName = (seasonTypeId) => {
  const seasonType = getSeasonType(seasonTypeId);
  return seasonType ? seasonType.displayName : "Unknown";
};

/**
 * Get short name for season type
 * @param {number} seasonTypeId - The season type ID
 * @returns {string} Short name or 'UNK'
 */
export const getSeasonTypeShortName = (seasonTypeId) => {
  const seasonType = getSeasonType(seasonTypeId);
  return seasonType ? seasonType.shortName : "UNK";
};

/**
 * Get color for season type
 * @param {number} seasonTypeId - The season type ID
 * @returns {string} Color hex code or default gray
 */
export const getSeasonTypeColor = (seasonTypeId) => {
  const seasonType = getSeasonType(seasonTypeId);
  return seasonType ? seasonType.color : "#d9d9d9";
};

/**
 * Get maximum weeks for season type
 * @param {number} seasonTypeId - The season type ID
 * @returns {number} Maximum weeks or 18 as default
 */
export const getSeasonTypeMaxWeeks = (seasonTypeId) => {
  const seasonType = getSeasonType(seasonTypeId);
  return seasonType ? seasonType.maxWeeks : 18;
};

/**
 * Get all season types as an array
 * @returns {array} Array of season type objects
 */
export const getAllSeasonTypes = () => {
  return Object.values(NFL_SEASON_TYPES);
};

/**
 * Get season types formatted for select options
 * @returns {array} Array of {value, label} objects for select components
 */
export const getSeasonTypeOptions = () => {
  return getAllSeasonTypes().map((seasonType) => ({
    value: seasonType.id,
    label: seasonType.displayName,
    shortName: seasonType.shortName,
    color: seasonType.color,
    icon: seasonType.icon,
  }));
};

/**
 * Validate if a season type ID is valid
 * @param {number} seasonTypeId - The season type ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidSeasonType = (seasonTypeId) => {
  return NFL_SEASON_TYPES.hasOwnProperty(seasonTypeId);
};

/**
 * Validate if a week number is valid for a given season type
 * @param {number} week - The week number
 * @param {number} seasonTypeId - The season type ID
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidWeekForSeasonType = (week, seasonTypeId) => {
  if (!isValidSeasonType(seasonTypeId)) return false;
  if (!week || week < 1) return false;

  const maxWeeks = getSeasonTypeMaxWeeks(seasonTypeId);
  return week <= maxWeeks;
};

/**
 * Get formatted season display text
 * @param {number} year - The season year
 * @param {number} seasonTypeId - The season type ID
 * @param {number} week - The week number (optional)
 * @returns {string} Formatted display text
 */
export const getSeasonDisplayText = (year, seasonTypeId, week = null) => {
  const seasonType = getSeasonType(seasonTypeId);
  if (!seasonType) return `${year} Season`;

  let text = `${year} ${seasonType.displayName}`;
  if (week) {
    text += ` Week ${week}`;
  }

  return text;
};

/**
 * Get season type with additional metadata for UI components
 * @param {number} seasonTypeId - The season type ID
 * @returns {object|null} Enhanced season type object or null
 */
export const getSeasonTypeWithMeta = (seasonTypeId) => {
  const seasonType = getSeasonType(seasonTypeId);
  if (!seasonType) return null;

  return {
    ...seasonType,
    // Additional computed properties for UI
    badgeProps: {
      color: seasonType.color,
      text: seasonType.shortName,
    },
    tagProps: {
      color: seasonType.color,
      icon: seasonType.icon,
    },
  };
};

export default NFL_SEASON_TYPES;
