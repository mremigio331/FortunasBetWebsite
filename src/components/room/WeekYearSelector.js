import React from "react";
import { Row, Col, Typography, Select } from "antd";
import { getSeasonTypeOptions } from "../../config/nflSeasonTypes";

const { Text } = Typography;
const { Option } = Select;

const WeekYearSelector = ({
  selectedSeasonType,
  setSelectedSeasonType,
  selectedYear,
  setSelectedYear,
  selectedWeek,
  setSelectedWeek,
  weekOptions,
  yearOptions,
  seasonTypeOptions,
  isValidCombination,
}) => {
  // Handle season type change with validation
  const handleSeasonTypeChange = (value) => {
    setSelectedSeasonType(value);

    // Reset week to 1 if current week is not valid for new season type
    if (
      isValidCombination &&
      !isValidCombination(selectedYear, value, selectedWeek)
    ) {
      setSelectedWeek(1);
    }
  };

  // Handle year change with validation
  const handleYearChange = (value) => {
    setSelectedYear(value);

    // Reset week to 1 if current combination is not valid
    if (
      isValidCombination &&
      !isValidCombination(value, selectedSeasonType, selectedWeek)
    ) {
      setSelectedWeek(1);
    }
  };

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      <Col xs={24} sm={8}>
        <div>
          <Text strong>Season Type:</Text>
          <Select
            value={selectedSeasonType}
            onChange={handleSeasonTypeChange}
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
          <Text strong>Year:</Text>
          <Select
            value={selectedYear}
            onChange={handleYearChange}
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
        <div>
          <Text strong>Week:</Text>
          <Select
            value={selectedWeek}
            onChange={setSelectedWeek}
            style={{ width: "100%", marginTop: "4px" }}
            placeholder="Select week"
          >
            {weekOptions.map((week) => (
              <Option key={week} value={week}>
                Week {week}
              </Option>
            ))}
          </Select>
        </div>
      </Col>
    </Row>
  );
};

export default WeekYearSelector;
