import React from "react";
import { Row, Col, Typography, Select } from "antd";

const { Text } = Typography;
const { Option } = Select;

/**
 * NFL season-type / year / week selector.
 *
 * Every control reports through the change handlers created by
 * `useNFLWeekSelection.createChangeHandlers`. That matters: those handlers are
 * what record a Deliberate_Selection, and a Deliberate_Selection is what stops a
 * later resolution or window-focus refetch from moving the user's week
 * (Requirements 2.1, 2.2, 2.3).
 *
 * This component previously received the raw `setSelected*` state setters, which
 * do *not* record a deliberate selection — so a user's pick would be silently
 * overwritten the next time the current week resolved. It also reset the week to
 * a hardcoded `1` when a year/season-type change invalidated the combination;
 * keeping the three controls coherent is now the hook's job, and it falls back to
 * the first week actually available for the new combination.
 *
 * While the Current_Week is still resolving, the week control shows a loading
 * state instead of a provisional week presented as confirmed (Requirement 1.4).
 */
const WeekYearSelector = ({
  selectedSeasonType,
  onSeasonTypeChange,
  selectedYear,
  onYearChange,
  selectedWeek,
  onWeekChange,
  weekOptions,
  yearOptions,
  seasonTypeOptions,
  isWeekLoading = false,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      <Col xs={24} sm={8}>
        <div>
          <Text strong id="nfl-season-type-label">
            Season Type:
          </Text>
          <Select
            aria-labelledby="nfl-season-type-label"
            value={selectedSeasonType ?? undefined}
            onChange={onSeasonTypeChange}
            style={{ width: "100%", marginTop: "4px" }}
            placeholder="Select season type"
          >
            {seasonTypeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={8}>
        <div>
          <Text strong id="nfl-year-label">
            Year:
          </Text>
          <Select
            aria-labelledby="nfl-year-label"
            value={selectedYear ?? undefined}
            onChange={onYearChange}
            style={{ width: "100%", marginTop: "4px" }}
            placeholder="Select year"
          >
            {yearOptions.map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
      <Col xs={24} sm={8}>
        <div aria-busy={isWeekLoading}>
          <Text strong id="nfl-week-label">
            Week:
          </Text>
          <Select
            aria-labelledby="nfl-week-label"
            value={isWeekLoading ? undefined : (selectedWeek ?? undefined)}
            onChange={onWeekChange}
            style={{ width: "100%", marginTop: "4px" }}
            loading={isWeekLoading}
            disabled={isWeekLoading}
            placeholder={
              isWeekLoading ? "Finding current week..." : "Select week"
            }
          >
            {weekOptions.map((week) => (
              <Option key={week} value={week}>
                Week {week}
              </Option>
            ))}
          </Select>
          {isWeekLoading && (
            <Text
              type="secondary"
              role="status"
              aria-live="polite"
              style={{ fontSize: "12px" }}
            >
              Finding the current week...
            </Text>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default WeekYearSelector;
