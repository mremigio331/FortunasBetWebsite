import React from "react";
import { Card, Row, Col, Typography } from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const RoomInfoCards = ({ room }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <CalendarOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          <div style={{ marginTop: "8px" }}>
            <Text strong>Created</Text>
            <br />
            <Text type="secondary">
              {new Date(room.created_date).toLocaleDateString()}
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <TrophyOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
          <div style={{ marginTop: "8px" }}>
            <Text strong>Betting Period</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {room.start_date && room.end_date ? (
                <>
                  {new Date(room.start_date * 1000).toLocaleDateString()} -{" "}
                  <br />
                  {new Date(room.end_date * 1000).toLocaleDateString()}
                </>
              ) : (
                "Not set"
              )}
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <CalendarOutlined style={{ fontSize: "24px", color: "#fa8c16" }} />
          <div style={{ marginTop: "8px" }}>
            <Text strong>Last Updated</Text>
            <br />
            <Text type="secondary">
              {new Date(room.updated_date).toLocaleDateString()}
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <UserOutlined style={{ fontSize: "24px", color: "#722ed1" }} />
          <div style={{ marginTop: "8px" }}>
            <Text strong>Admins</Text>
            <br />
            <Text type="secondary">
              {room.admin_user_ids ? room.admin_user_ids.length : 0}
            </Text>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default RoomInfoCards;
