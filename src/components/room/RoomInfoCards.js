import React from "react";
import { Card, Row, Col, Typography } from "antd";
import { TrophyOutlined, TeamOutlined } from "@ant-design/icons";

const { Text } = Typography;

const RoomInfoCards = ({ room }) => {
  return (
    <Row gutter={[16, 16]} justify="center">
      <Col xs={24} sm={12} md={8} lg={6}>
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
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <TeamOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          <div style={{ marginTop: "8px" }}>
            <Text strong>Leagues</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {room.leagues && room.leagues.length > 0
                ? room.leagues.join(", ")
                : "No leagues"}
            </Text>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default RoomInfoCards;
