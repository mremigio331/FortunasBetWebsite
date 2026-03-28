import React from "react";
import { Tag, Button, Space } from "antd";
import {
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  UserAddOutlined,
  EyeOutlined,
} from "@ant-design/icons";

/**
 * Shared component for rendering membership status tags.
 *
 * @param {string} status - "admin" | "approved" | "member" | "pending" | "denied" | "none"
 * @param {function} [onRequestAccess] - Callback when "Request Access" is clicked
 * @param {function} [onViewRoom] - Callback when "View" is clicked
 * @param {boolean} [loading] - Loading state for the request access button
 */
const MembershipStatusTag = ({
  status,
  onRequestAccess,
  onViewRoom,
  loading = false,
}) => {
  if (status === "admin") {
    return (
      <Space>
        <Tag icon={<CrownOutlined />} color="gold">
          Admin
        </Tag>
        {onViewRoom && (
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={onViewRoom}
          >
            View
          </Button>
        )}
      </Space>
    );
  }

  if (status === "approved" || status === "member") {
    return (
      <Space>
        <Tag icon={<CheckCircleOutlined />} color="green">
          Member
        </Tag>
        {onViewRoom && (
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={onViewRoom}
          >
            View
          </Button>
        )}
      </Space>
    );
  }

  if (status === "pending") {
    return (
      <Tag icon={<ClockCircleOutlined />} color="orange">
        Pending
      </Tag>
    );
  }

  if (status === "denied") {
    return (
      <Tag icon={<ClockCircleOutlined />} color="red">
        Denied
      </Tag>
    );
  }

  // Default: no membership — show request access button if callback provided
  if (onRequestAccess) {
    return (
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        size="small"
        loading={loading}
        onClick={onRequestAccess}
      >
        Request Access
      </Button>
    );
  }

  return null;
};

export default MembershipStatusTag;
