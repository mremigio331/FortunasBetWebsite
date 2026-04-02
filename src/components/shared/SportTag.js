import React from "react";
import { Tag } from "antd";

/**
 * Sport-specific styling config for NFL and MLB rooms.
 * Each sport gets a unique color scheme and emoji icon.
 */
const SPORT_STYLES = {
  NFL: {
    emoji: "🏈",
    color: "#6B3A1F",
    backgroundColor: "#FFF1E6",
    borderColor: "#D4845A",
  },
  MLB: {
    emoji: "⚾",
    color: "#1A4D8F",
    backgroundColor: "#E6F0FF",
    borderColor: "#5A9BD4",
  },
};

const DEFAULT_STYLE = SPORT_STYLES.NFL;

/**
 * Renders a sport badge with distinct visual styling for NFL vs MLB.
 *
 * @param {string} sport - "NFL" or "MLB"
 * @param {"small"|"default"} [size="default"] - Tag size variant
 */
const SportTag = ({ sport = "NFL", size = "default" }) => {
  const config = SPORT_STYLES[sport] || DEFAULT_STYLE;
  const isSmall = size === "small";

  return (
    <Tag
      style={{
        color: config.color,
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        fontWeight: 600,
        fontSize: isSmall ? "11px" : "13px",
        padding: isSmall ? "0 6px" : "2px 10px",
        lineHeight: isSmall ? "20px" : "24px",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span role="img" aria-label={sport}>
        {config.emoji}
      </span>
      {sport}
    </Tag>
  );
};

export default SportTag;
