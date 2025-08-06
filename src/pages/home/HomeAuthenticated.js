import React from "react";
import { Button, Layout, Typography, Card, List, Space, Tag, Spin } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useUserProfile } from "../../provider/UserProfileProvider";
import useGetUserMembershipRequests from "../../hooks/membership/useGetUserMembershipRequests";
const { Content } = Layout;
const { Title, Text } = Typography;

const HomeAuthenticated = () => {
  const navigate = useNavigate();
  const { userProfile, isUserFetching, userRefetch } = useUserProfile();
  const {
    userMembershipRequests,
    membershipRequestsByStatus,
    isUserMembershipRequestsFetching,
    isUserMembershipRequestsError,
    userMembershipRequestsError,
  } = useGetUserMembershipRequests(true);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "32px 16px 0 16px" }}>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Welcome to Fortunas Bets
          </Title>
          <Text>{`You have signed in as ${userProfile?.name || "User"}`}</Text>
        </div>
        <div style={{ maxWidth: 600, margin: "32px auto 0 auto" }}>
          <Title level={3} style={{ marginBottom: 16, textAlign: "left" }}>
            Your Rooms
          </Title>
          {isUserMembershipRequestsFetching ? (
            <Spin size="large" />
          ) : isUserMembershipRequestsError ? (
            <Card style={{ marginBottom: 16 }}>
              <Text type="danger">
                Error loading rooms:{" "}
                {userMembershipRequestsError?.message || "Unknown error"}
              </Text>
            </Card>
          ) : userMembershipRequests && userMembershipRequests.length > 0 ? (
            <>
              <Title level={4} style={{ marginBottom: 8 }}>
                Active Rooms
              </Title>
              <List
                itemLayout="vertical"
                dataSource={membershipRequestsByStatus.approved}
                renderItem={(room) => (
                  <Card
                    style={{ marginBottom: 12, boxShadow: "0 2px 8px #f0f1f2" }}
                    key={room.room_id}
                    bodyStyle={{ padding: "16px 20px" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Link
                        to={`/room/${room.room_id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: 18,
                          color: "#1890ff",
                          textDecoration: "none",
                        }}
                      >
                        {room.room_name || room.room_id}
                      </Link>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Room ID: {room.room_id}
                      </Text>
                      <Tag color="blue" style={{ fontSize: 13 }}>
                        Points: 0
                      </Tag>
                    </Space>
                  </Card>
                )}
              />
              <Title level={4} style={{ margin: "24px 0 8px" }}>
                Pending Rooms
              </Title>
              <List
                itemLayout="vertical"
                dataSource={membershipRequestsByStatus.pending}
                renderItem={(room) => (
                  <Card
                    style={{ marginBottom: 12, boxShadow: "0 2px 8px #f0f1f2" }}
                    key={room.room_id}
                    bodyStyle={{ padding: "16px 20px" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Link
                        to={`/room/${room.room_id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: 18,
                          color: "#faad14",
                          textDecoration: "none",
                        }}
                      >
                        {room.room_name || room.room_id}
                      </Link>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Room ID: {room.room_id}
                      </Text>
                      <Tag color="orange" style={{ fontSize: 13 }}>
                        Pending Approval
                      </Tag>
                    </Space>
                  </Card>
                )}
              />
            </>
          ) : (
            <Text type="secondary">You are not a member of any rooms yet.</Text>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default HomeAuthenticated;
