import React from "react";
import { Button, Tag, Typography, Space } from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  HourglassOutlined,
} from "@ant-design/icons";
const { Title, Text } = Typography;

const RoomHeader = ({
  room,
  isMember,
  isMembershipFetching,
  currentUserId,
  members,
  onRequestMembership,
}) => {
  // Membership status logic
  let membershipTag = null;
  let requestButton = null;

  if (isMembershipFetching) {
    membershipTag = (
      <Tag icon={<HourglassOutlined />} color="default">
        Checking membership...
      </Tag>
    );
  } else {
    // Find current user in members array
    const userMember = Array.isArray(members)
      ? members.find((m) => m.user_id === currentUserId)
      : null;

    if (userMember && userMember.status === "approved") {
      membershipTag = (
        <Tag icon={<UserOutlined />} color="blue">
          Member
        </Tag>
      );
    } else if (userMember && userMember.status === "pending") {
      membershipTag = (
        <Tag icon={<HourglassOutlined />} color="orange">
          Pending Approval
        </Tag>
      );
    } else {
      requestButton = (
        <Button type="primary" size="small" onClick={onRequestMembership}>
          Request Membership
        </Button>
      );
    }
  }

  return (
    <div
      style={{
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Title level={2} style={{ margin: 0 }}>
          {room.room_name}
        </Title>
        <Text type="secondary">Room ID: {room.room_id}</Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
            alignItems: "center",
          }}
        >
          <Tag
            icon={room.is_private ? <LockOutlined /> : <UnlockOutlined />}
            color={room.is_private ? "red" : "green"}
            style={{ fontSize: "14px", padding: "4px 8px" }}
          >
            {room.is_private ? "Private" : "Public"}
          </Tag>
          {membershipTag}
          {requestButton}
        </div>
      </div>
    </div>
  );
};

export default RoomHeader;
