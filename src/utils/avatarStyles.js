/**
 * Shared avatar color-to-style mapping utility.
 * Single source of truth for avatar colors used across the app.
 */

export const COLOR_OPTIONS = [
  { value: "black", label: "Black", color: "#262626" },
  { value: "white", label: "White", color: "#ffffff" },
  { value: "red", label: "Red", color: "#ff4d4f" },
  { value: "blue", label: "Blue", color: "#1890ff" },
  { value: "green", label: "Green", color: "#52c41a" },
  { value: "yellow", label: "Yellow", color: "#faad14" },
  { value: "orange", label: "Orange", color: "#fa8c16" },
  { value: "purple", label: "Purple", color: "#722ed1" },
  { value: "pink", label: "Pink", color: "#eb2f96" },
  { value: "brown", label: "Brown", color: "#8b4513" },
  { value: "gray", label: "Gray", color: "#8c8c8c" },
  { value: "cyan", label: "Cyan", color: "#13c2c2" },
];

const COLOR_MAP = {
  black: { backgroundColor: "#262626", color: "#ffffff" },
  white: {
    backgroundColor: "#ffffff",
    color: "#262626",
    border: "1px solid #d9d9d9",
  },
  red: { backgroundColor: "#ff4d4f", color: "#ffffff" },
  blue: { backgroundColor: "#1890ff", color: "#ffffff" },
  green: { backgroundColor: "#52c41a", color: "#ffffff" },
  yellow: { backgroundColor: "#faad14", color: "#262626" },
  orange: { backgroundColor: "#fa8c16", color: "#ffffff" },
  purple: { backgroundColor: "#722ed1", color: "#ffffff" },
  pink: { backgroundColor: "#eb2f96", color: "#ffffff" },
  brown: { backgroundColor: "#8b4513", color: "#ffffff" },
  gray: { backgroundColor: "#8c8c8c", color: "#ffffff" },
  cyan: { backgroundColor: "#13c2c2", color: "#ffffff" },
};

const DEFAULT_STYLE = COLOR_MAP.black;

/**
 * Returns a CSS style object for the given avatar color name.
 * @param {string} colorName - One of the 12 supported color names.
 * @returns {{ backgroundColor: string, color: string, border?: string }}
 */
export function getAvatarStyle(colorName = "black") {
  if (!colorName || typeof colorName !== "string") return DEFAULT_STYLE;
  return COLOR_MAP[colorName.toLowerCase()] || DEFAULT_STYLE;
}
