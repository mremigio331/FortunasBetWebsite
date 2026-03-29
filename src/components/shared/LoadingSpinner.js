import React from "react";
import { Spin, Typography } from "antd";

const { Text } = Typography;

const LoadingSpinner = ({ message, size = "large" }) => {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <Spin size={size} />
      {message && (
        <div style={{ marginTop: "16px" }}>
          <Text>{message}</Text>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
