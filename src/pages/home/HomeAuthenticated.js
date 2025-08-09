import React from "react";
import { Button, Layout, Typography, Card, List, Space, Tag, Spin } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useUserProfile } from "../../provider/UserProfileProvider";
import useGetUserMembershipRequests from "../../hooks/membership/useGetUserMembershipRequests";
import useGetUserBetsForCurrentWeek from "../../hooks/bet/useGetUserBetsForCurrentWeek";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import { Collapse, Row, Col } from "antd";
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

  const {
    currentWeekInfo,
    isFetching: isUserBetsFetching,
    isError: isUserBetsError,
    error: userBetsError,
    refetch: refetchUserBets,
  } = useGetUserBetsForCurrentWeek(true);

  // Helper to render a bet card or orange card if null
  const renderBetCardOrPrompt = (bet, pointLabel) => {
    if (!bet) {
      return (
        <Card
          size="small"
          style={{
            background: "#fffbe6",
            border: "1px solid #faad14",
            marginBottom: 8,
          }}
        >
          <Tag color="orange">NEED TO PLACE {pointLabel.toUpperCase()} BET</Tag>
        </Card>
      );
    }
    // Reuse the RoomBetsDisplay renderBetCard logic here if possible, else show summary
    // For brevity, show a simple summary:
    const matchup = bet.odds_snapshot?.matchup || "Game";
    const betType =
      bet.game_bet?.bet_type === "spread" ? "Spread" : "Over/Under";
    const betDesc =
      bet.game_bet?.bet_type === "spread"
        ? `${bet.game_bet.team_choice?.toUpperCase()} ${bet.game_bet.spread_value ?? bet.odds_snapshot?.spread ?? ""}`
        : `${bet.game_bet.over_under_choice?.toUpperCase()} ${bet.game_bet.total_value ?? bet.odds_snapshot?.overUnder ?? ""}`;
    return (
      <Card size="small" style={{ marginBottom: 8 }}>
        <Space direction="vertical">
          <Text strong>{matchup}</Text>
          <Text type="secondary">
            {betType}: {betDesc}
          </Text>
          <Tag color="blue">{bet.points_wagered} pt</Tag>
        </Space>
      </Card>
    );
  };

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
          {isUserMembershipRequestsFetching || isUserBetsFetching ? (
            <Spin size="large" />
          ) : isUserMembershipRequestsError || isUserBetsError ? (
            <Card style={{ marginBottom: 16 }}>
              <Text type="danger">
                Error loading rooms or bets:{" "}
                {userMembershipRequestsError?.message ||
                  userBetsError?.message ||
                  "Unknown error"}
              </Text>
            </Card>
          ) : userMembershipRequests && userMembershipRequests.length > 0 ? (
            <>
              <Title level={4} style={{ marginBottom: 8 }}>
                Active Rooms
              </Title>
              {membershipRequestsByStatus.approved.map((room) => {
                const roomBets = currentWeekInfo?.bets?.[room.room_id] || {};
                return (
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
                      <Collapse
                        accordion
                        size="small"
                        style={{ background: "#f6faff" }}
                      >
                        <Collapse.Panel
                          header="Your Bets for This Week"
                          key="bets"
                        >
                          <div style={{ marginBottom: 8 }}>
                            {renderBetCardOrPrompt(
                              roomBets.one_point,
                              "one point",
                            )}
                            {renderBetCardOrPrompt(
                              roomBets.two_point,
                              "two point",
                            )}
                            {renderBetCardOrPrompt(
                              roomBets.three_point,
                              "three point",
                            )}
                          </div>
                        </Collapse.Panel>
                      </Collapse>
                    </Space>
                  </Card>
                );
              })}
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
