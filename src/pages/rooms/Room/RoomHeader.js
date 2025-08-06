import React from "react";
import { Button, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
const { Title, Text } = Typography;

const RoomHeader = ({ room, handleGoBack }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
    }}
  >
    <div>
      <Title level={2} style={{ margin: 0 }}>
        {room.room_name}
      </Title>
      <Text type="secondary">Room ID: {room.room_id}</Text>
    </div>
    <Tag
      icon={room.is_private ? <LockOutlined /> : <UnlockOutlined />}
      color={room.is_private ? "red" : "green"}
      style={{ fontSize: "14px", padding: "4px 8px" }}
    >
      {room.is_private ? "Private" : "Public"}
    </Tag>
    <Button
      icon={<ArrowLeftOutlined />}
      onClick={handleGoBack}
      style={{ marginBottom: "16px" }}
    >
      Back
    </Button>
  </div>
);

export default RoomHeader;
