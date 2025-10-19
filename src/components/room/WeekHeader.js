import React from "react";
import { Button } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";

const WeekHeader = ({
  week,
  bets = [],
  expanded = false,
  onToggle = () => {},
}) => {
  const points = bets.reduce((sum, b) => sum + (b.total_points_earned || 0), 0);
  const label = `Week ${week} — Points earned ${points}`;

  return (
    <Button type="link" onClick={onToggle} style={{ paddingLeft: 0 }}>
      {expanded ? <DownOutlined /> : <RightOutlined />} {label}
    </Button>
  );
};

export default WeekHeader;
