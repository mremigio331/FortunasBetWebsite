import React from "react";
import { Button, Layout, Typography, Card, List, Space, Tag, Spin } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useUserProfile } from "../../provider/UserProfileProvider";
import useGetUserMembershipRequests from "../../hooks/membership/useGetUserMembershipRequests";
import useGetUserBetsForCurrentWeek from "../../hooks/bet/useGetUserBetsForCurrentWeek";
import {
  DownOutlined,
  RightOutlined,
  EyeInvisibleOutlined,
  TrophyFilled,
} from "@ant-design/icons";
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

  // Helper to render a bet card or orange card if null, using RoomBetsDisplay logic
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
    // --- RoomBetsDisplay renderBetCard logic ---
    const isPrivate = !bet.game_bet;
    const betDate = bet.event_datetime
      ? new Date(bet.event_datetime * 1000).toLocaleDateString()
      : "Unknown";
    let homeTeam = "Home Team";
    let awayTeam = "Away Team";
    if (bet.odds_snapshot?.teams) {
      const { home, away } = bet.odds_snapshot.teams;
      if (home?.name) homeTeam = home.name;
      if (away?.name) awayTeam = away.name;
    }
    const spreadValue = bet.game_bet?.spread_value || bet.odds_snapshot?.spread;
    const totalValue =
      bet.game_bet?.total_value || bet.odds_snapshot?.overUnder;
    const getBetStatusInfo = () => {
      if (isPrivate) {
        return {
          color: "#8c8c8c",
          borderColor: "#d9d9d9",
          tagColor: "default",
          statusText: "HIDDEN",
          statusIcon: <EyeInvisibleOutlined />,
        };
      }
      if (!bet.game_bet?.result) {
        return {
          color: "#1890ff",
          borderColor: "#1890ff",
          tagColor: "blue",
          statusText: "ACTIVE",
          statusIcon: null,
        };
      }
      switch (bet.game_bet.result) {
        case "win":
          return {
            color: "#52c41a",
            borderColor: "#52c41a",
            tagColor: "green",
            statusText: "WIN",
            statusIcon: null,
          };
        case "loss":
          return {
            color: "#ff4d4f",
            borderColor: "#ff4d4f",
            tagColor: "red",
            statusText: "LOSS",
            statusIcon: null,
          };
        case "push":
          return {
            color: "#faad14",
            borderColor: "#faad14",
            tagColor: "orange",
            statusText: "PUSH",
            statusIcon: null,
          };
        default:
          return {
            color: "#1890ff",
            borderColor: "#1890ff",
            tagColor: "blue",
            statusText: "PENDING",
            statusIcon: null,
          };
      }
    };
    const statusInfo = getBetStatusInfo();
    return (
      <Card
        key={`${bet.user_id}-${bet.game_id}-${bet.points_wagered}`}
        size="small"
        style={{
          marginBottom: "8px",
          border: `2px solid ${statusInfo.borderColor}`,
          borderRadius: "8px",
          backgroundColor: isPrivate ? "#fafafa" : "white",
        }}
        bodyStyle={{ padding: "12px" }}
      >
        <Row justify="space-between" align="middle">
          <Col span={16}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text strong style={{ fontSize: "16px" }}>
                  {awayTeam} @ {homeTeam}
                </Text>
                <Tag color={statusInfo.tagColor} size="small">
                  {statusInfo.statusIcon} {statusInfo.statusText}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {betDate}
              </Text>
              {bet.game_bet && (
                <div>
                  <Space size="small" wrap>
                    <Tag color="blue" size="small">
                      {bet.game_bet.bet_type === "spread" ? "Spread" : "Total"}
                    </Tag>
                    <Text
                      style={{
                        fontSize: "13px",
                        color: statusInfo.color,
                        fontWeight: "500",
                      }}
                    >
                      {bet.game_bet.bet_type === "spread"
                        ? `${bet.game_bet.team_choice?.toUpperCase()} ${spreadValue ? (spreadValue > 0 ? `+${spreadValue}` : spreadValue) : "TBD"}`
                        : `${bet.game_bet.over_under_choice?.toUpperCase()} ${totalValue || "TBD"}`}
                    </Text>
                  </Space>
                </div>
              )}
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Space direction="vertical" size="small" align="end">
              <Text
                strong
                style={{ color: statusInfo.color, fontSize: "16px" }}
              >
                {bet.points_wagered} pts
              </Text>
              {bet.total_points_earned !== undefined &&
                bet.total_points_earned !== null && (
                  <Text
                    style={{
                      fontSize: "12px",
                      color:
                        bet.total_points_earned > 0 ? "#52c41a" : "#ff4d4f",
                      fontWeight: "500",
                    }}
                  >
                    Earned: {bet.total_points_earned > 0 ? "+" : ""}
                    {bet.total_points_earned}
                  </Text>
                )}
            </Space>
          </Col>
        </Row>
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
                          header={
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              Your Bets for This Week
                              {["one_point", "two_point", "three_point"].map(
                                (pt, idx) => {
                                  const bet = roomBets[pt];
                                  let color = "#d9d9d9"; // default gray
                                  if (bet && bet.game_bet?.result === "win")
                                    color = "#52c41a";
                                  else if (
                                    bet &&
                                    bet.game_bet?.result === "loss"
                                  )
                                    color = "#ff4d4f";
                                  else if (
                                    bet &&
                                    bet.game_bet?.result === "push"
                                  )
                                    color = "#faad14";
                                  else if (bet && !bet.game_bet?.result)
                                    color = "#8c8c8c";
                                  return (
                                    <span
                                      key={pt}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        marginLeft: 4,
                                      }}
                                    >
                                      <TrophyFilled
                                        style={{
                                          color,
                                          fontSize: 18,
                                          marginRight: 2,
                                        }}
                                      />
                                      <span style={{ fontWeight: 600, color }}>
                                        {idx + 1}
                                      </span>
                                    </span>
                                  );
                                },
                              )}
                            </span>
                          }
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
                          {/* Total points for the week */}
                          <div style={{ textAlign: "right", marginTop: 8 }}>
                            <Tag
                              color="#52c41a"
                              style={{ fontSize: 15, fontWeight: 600 }}
                            >
                              Total Points Won:{" "}
                              {["one_point", "two_point", "three_point"].reduce(
                                (sum, pt) => {
                                  const bet = roomBets[pt];
                                  return (
                                    sum +
                                    (bet && bet.total_points_earned
                                      ? bet.total_points_earned
                                      : 0)
                                  );
                                },
                                0,
                              )}
                            </Tag>
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
