import React from "react";
import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const ErrorAlert = ({ title, description, onRetry }) => {
  return (
    <Alert
      message={title}
      description={description}
      type="error"
      showIcon
      action={
        onRetry ? (
          <Button size="small" onClick={onRetry} icon={<ReloadOutlined />}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
};

export default ErrorAlert;
