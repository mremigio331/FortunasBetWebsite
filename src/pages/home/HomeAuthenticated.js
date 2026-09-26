import React from "react";
import { Layout, Typography, Card, Spin } from "antd";
import { useUserProfile } from "../../provider/UserProfileProvider";
import useGetHomeRooms from "../../hooks/home/useGetHomeRooms";
import HomeRoomCard from "../../components/home/HomeRoomCard";

const { Content } = Layout;
const { Title, Text } = Typography;

const HomeAuthenticated = () => {
  const { userProfile } = useUserProfile();
  // Fast room list; each card lazily loads its own current-week bets so the
  // list renders immediately without waiting on per-room bet/week computation.
  const { rooms, isLoading, isError, error } = useGetHomeRooms(true);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "32px 16px 0 16px" }}>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Welcome to Fortunas
          </Title>
          <Text>{`You have signed in as ${userProfile?.name || "User"}`}</Text>
        </div>
        <div style={{ maxWidth: 600, margin: "32px auto 0 auto" }}>
          <Title level={3} style={{ margin: "0 0 16px 0", textAlign: "left" }}>
            Your Rooms
          </Title>
          {isLoading ? (
            <Spin size="large" />
          ) : isError ? (
            <Card style={{ marginBottom: 16 }}>
              <Text type="danger">
                Error loading rooms: {error?.message || "Unknown error"}
              </Text>
            </Card>
          ) : rooms && rooms.length > 0 ? (
            rooms.map((room) => <HomeRoomCard key={room.room_id} room={room} />)
          ) : (
            <Text type="secondary">You are not a member of any rooms yet.</Text>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default HomeAuthenticated;
