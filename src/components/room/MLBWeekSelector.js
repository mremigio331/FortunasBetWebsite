import React from "react";
import { Row, Col, Typography, Select } from "antd";

const { Text } = Typography;
const { Option } = Select;

/**
 * MLB week selector — a single dropdown for Mon-Sun week ranges.
 * Much simpler than the NFL selector (no season type or year).
 *
 * While the Current_Week is still resolving, the control shows a loading state
 * rather than a provisional week presented as confirmed (Requirement 1.4).
 */
const MLBWeekSelector = ({
  selectedWeekNumber,
  onWeekChange,
  weekOptions,
  isWeekLoading = false,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      <Col xs={24} sm={12}>
        <div aria-busy={isWeekLoading}>
          <Text strong id="mlb-week-label">
            MLB Week:
          </Text>
          <Select
            aria-labelledby="mlb-week-label"
            value={
              isWeekLoading ? undefined : (selectedWeekNumber ?? undefined)
            }
            onChange={onWeekChange}
            style={{ width: "100%", marginTop: "4px" }}
            loading={isWeekLoading}
            disabled={isWeekLoading}
            placeholder={
              isWeekLoading ? "Finding current week..." : "Select week"
            }
          >
            {weekOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
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

export default MLBWeekSelector;
