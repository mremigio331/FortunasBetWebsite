import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Button,
  Tag,
  Space,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import useGetRoom from "../../hooks/room/useGetRoom";

const { Title, Text, Paragraph } = Typography;

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const { room, isRoomFetching, isRoomError, roomError, roomRefetch } =
    useGetRoom(roomId);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isRoomFetching) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isRoomError) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Error Loading Room"
          description={roomError?.message || "Failed to load room information"}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={roomRefetch}>
                Retry
              </Button>
              <Button size="small" onClick={handleGoBack}>
                Go Back
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Room Not Found"
          description="The room you're looking for doesn't exist or you don't have access to it"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={handleGoBack}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ marginBottom: "16px" }}
          >
            Back
          </Button>
        </Col>

        <Col span={24}>
          <Card>
            <Row gutter={[24, 24]}>
              <Col span={24}>
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
                    icon={
                      room.is_private ? <LockOutlined /> : <UnlockOutlined />
                    }
                    color={room.is_private ? "red" : "green"}
                    style={{ fontSize: "14px", padding: "4px 8px" }}
                  >
                    {room.is_private ? "Private" : "Public"}
                  </Tag>
                </div>
              </Col>

              {room.room_description && (
                <Col span={24}>
                  <Divider orientation="left">Description</Divider>
                  <Paragraph style={{ fontSize: "16px" }}>
                    {room.room_description}
                  </Paragraph>
                </Col>
              )}

              <Col span={24}>
                <Divider orientation="left">Room Information</Divider>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" style={{ textAlign: "center" }}>
                      <CalendarOutlined
                        style={{ fontSize: "24px", color: "#1890ff" }}
                      />
                      <div style={{ marginTop: "8px" }}>
                        <Text strong>Created</Text>
                        <br />
                        <Text type="secondary">
                          {new Date(room.created_date).toLocaleDateString()}
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" style={{ textAlign: "center" }}>
                      <CalendarOutlined
                        style={{ fontSize: "24px", color: "#52c41a" }}
                      />
                      <div style={{ marginTop: "8px" }}>
                        <Text strong>Last Updated</Text>
                        <br />
                        <Text type="secondary">
                          {new Date(room.updated_date).toLocaleDateString()}
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" style={{ textAlign: "center" }}>
                      <UserOutlined
                        style={{ fontSize: "24px", color: "#fa8c16" }}
                      />
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
              </Col>

              {room.admin_user_ids && room.admin_user_ids.length > 0 && (
                <Col span={24}>
                  <Divider orientation="left">Room Admins</Divider>
                  <Space wrap>
                    {room.admin_user_ids.map((adminId, index) => (
                      <Tag key={adminId} color="blue">
                        Admin {index + 1}: {adminId}
                      </Tag>
                    ))}
                  </Space>
                </Col>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Room;
