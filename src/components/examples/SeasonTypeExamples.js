/**
 * Example usage of NFL Season Types Configuration
 * This file demonstrates how to use the nflSeasonTypes config throughout the application
 */

import React from "react";
import { Tag, Badge, Select, Typography } from "antd";
import {
  getSeasonType,
  getSeasonTypeDisplayName,
  getSeasonTypeColor,
  getSeasonTypeOptions,
  getSeasonDisplayText,
  isValidSeasonType,
  isValidWeekForSeasonType,
  getSeasonTypeWithMeta,
} from "../configs/nflSeasonTypes";

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * Example: Season Type Badge Component
 */
export const SeasonTypeBadge = ({ seasonTypeId, showIcon = false }) => {
  const seasonType = getSeasonType(seasonTypeId);

  if (!seasonType) return <Badge status="default" text="Unknown" />;

  return (
    <Badge
      color={seasonType.color}
      text={`${showIcon ? seasonType.icon + " " : ""}${seasonType.displayName}`}
    />
  );
};

/**
 * Example: Season Type Tag Component
 */
export const SeasonTypeTag = ({ seasonTypeId, year = null }) => {
  const seasonType = getSeasonType(seasonTypeId);

  if (!seasonType) return <Tag>Unknown</Tag>;

  return (
    <Tag color={seasonType.color}>
      {seasonType.icon} {year ? `${year} ` : ""}
      {seasonType.shortName}
    </Tag>
  );
};

/**
 * Example: Season Type Select Component
 */
export const SeasonTypeSelect = ({
  value,
  onChange,
  placeholder = "Select season type",
}) => {
  const options = getSeasonTypeOptions();

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: "100%" }}
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value}>
          <span style={{ color: option.color }}>
            {option.icon} {option.label}
          </span>
        </Option>
      ))}
    </Select>
  );
};

/**
 * Example: Week Validation Display
 */
export const WeekValidationDisplay = ({ week, seasonTypeId }) => {
  const isValid = isValidWeekForSeasonType(week, seasonTypeId);
  const seasonTypeName = getSeasonTypeDisplayName(seasonTypeId);

  return (
    <Text type={isValid ? "success" : "danger"}>
      Week {week} {isValid ? "is valid" : "is invalid"} for {seasonTypeName}
    </Text>
  );
};

/**
 * Example: Full Season Display Component
 */
export const SeasonDisplayComponent = ({ year, seasonTypeId, week = null }) => {
  const seasonType = getSeasonTypeWithMeta(seasonTypeId);

  if (!seasonType) {
    return <Text type="secondary">Invalid season type</Text>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Tag {...seasonType.tagProps}>{seasonType.shortName}</Tag>
      <Text strong>{getSeasonDisplayText(year, seasonTypeId, week)}</Text>
    </div>
  );
};

/**
 * Example: Season Type Info Card
 */
export const SeasonTypeInfoCard = ({ seasonTypeId }) => {
  const seasonType = getSeasonType(seasonTypeId);

  if (!seasonType) return null;

  return (
    <div
      style={{
        padding: "12px",
        border: `2px solid ${seasonType.color}`,
        borderRadius: "8px",
        backgroundColor: `${seasonType.color}10`,
      }}
    >
      <Title level={5} style={{ margin: 0, color: seasonType.color }}>
        {seasonType.icon} {seasonType.displayName}
      </Title>
      <Text type="secondary">{seasonType.description}</Text>
      <br />
      <Text>Max Weeks: {seasonType.maxWeeks}</Text>
    </div>
  );
};

// Usage examples in comments:
/*
// Basic usage:
const seasonName = getSeasonTypeDisplayName(2); // "Regular Season"
const color = getSeasonTypeColor(1); // "#52c41a"

// In a component:
<SeasonTypeBadge seasonTypeId={2} showIcon={true} />
<SeasonTypeTag seasonTypeId={3} year={2024} />
<SeasonDisplayComponent year={2024} seasonTypeId={2} week={5} />

// Validation:
const isValid = isValidWeekForSeasonType(19, 2); // false (max 18 weeks for regular season)
const isValidType = isValidSeasonType(4); // false (only 1, 2, 3 are valid)

// In selects/forms:
<SeasonTypeSelect 
  value={selectedSeasonType} 
  onChange={setSelectedSeasonType} 
/>
*/
