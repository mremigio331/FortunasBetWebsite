import React from "react";
import { Row, Col, Typography, Select } from "antd";

const { Text } = Typography;
const { Option } = Select;

/**
 * MLB week selector — a single dropdown for Mon-Sun week ranges.
 * Much simpler than the NFL selector (no season type or year).
 */
const MLBWeekSelector = ({ selectedWeekNumber, onWeekChange, weekOptions }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      <Col xs={24} sm={12}>
        <div>
          <Text strong>MLB Week:</Text>
          <Select
            value={selectedWeekNumber}
            onChange={onWeekChange}
            style={{ width: "100%", marginTop: "4px" }}
            placeholder="Select week"
          >
            {weekOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
    </Row>
  );
};

export default MLBWeekSelector;
