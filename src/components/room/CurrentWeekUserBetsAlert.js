import React from "react";
import { Alert, Row, Col, Card, Space, Tag, Typography } from "antd";
const { Text } = Typography;

const CurrentWeekUserBetsAlert = ({
  currentWeekUserBets,
  selectedWeek,
  weeklyTakenPoints,
}) => {
  if (!currentWeekUserBets.length) return null;
  return (
    <Alert
      message={`Your bets for Week ${selectedWeek} (${currentWeekUserBets.length}/3)`}
      description={
        <div style={{ marginTop: "8px" }}>
          <Row gutter={[12, 12]}>
            {currentWeekUserBets.map((bet, index) => {
              let awayTeam = "Away Team";
              let homeTeam = "Home Team";
              if (bet.odds_snapshot?.teams) {
                const { home, away } = bet.odds_snapshot.teams;
                if (home?.name) homeTeam = home.name;
                if (away?.name) awayTeam = away.name;
              } else if (
                bet.odds_snapshot?.home_team &&
                bet.odds_snapshot?.away_team
              ) {
                homeTeam = bet.odds_snapshot.home_team;
                awayTeam = bet.odds_snapshot.away_team;
              }
              const spreadValue =
                bet.game_bet?.spread_value || bet.odds_snapshot?.spread;
              const totalValue =
                bet.game_bet?.total_value ||
                bet.odds_snapshot?.overUnder ||
                bet.odds_snapshot?.total;
              const betDate = bet.event_datetime
                ? new Date(bet.event_datetime * 1000).toLocaleDateString(
                    "en-US",
                    { month: "numeric", day: "numeric", year: "numeric" },
                  )
                : "";
              return (
                <Col key={bet.game_id || index} xs={24} sm={12} lg={8}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #1890ff",
                      borderRadius: "6px",
                    }}
                  >
                    <Row align="middle">
                      <Col span={16}>
                        <Space
                          direction="vertical"
                          size="small"
                          style={{ width: "100%" }}
                        >
                          <Text strong style={{ fontSize: "16px" }}>
                            {awayTeam} @ {homeTeam}
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {betDate}
                            </Text>
                            <Tag color="green" size="small">
                              ACTIVE
                            </Tag>
                          </div>
                          {bet.game_bet && (
                            <div>
                              <Space size="small" wrap>
                                <Tag color="blue" size="small">
                                  {bet.game_bet.bet_type === "spread"
                                    ? "Spread"
                                    : "Total"}
                                </Tag>
                                <Text
                                  style={{
                                    fontSize: "13px",
                                    color: "#52c41a",
                                    fontWeight: "500",
                                  }}
                                >
                                  {bet.game_bet.bet_type === "spread"
                                    ? (() => {
                                        const teamChoice =
                                          bet.game_bet.team_choice;
                                        let teamName = teamChoice;
                                        if (teamChoice === "home")
                                          teamName = homeTeam;
                                        else if (teamChoice === "away")
                                          teamName = awayTeam;
                                        return `${teamName} ${spreadValue ? (spreadValue > 0 ? `+${spreadValue}` : spreadValue) : "TBD"}`;
                                      })()
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
                            style={{ color: "#1890ff", fontSize: "16px" }}
                          >
                            {bet.points_wagered} pts
                          </Text>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>
          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            💡 Point values {weeklyTakenPoints.join(", ")} are unavailable for
            new bets this week.
          </div>
        </div>
      }
      type="info"
      showIcon
      style={{ marginBottom: "16px" }}
    />
  );
};

export default CurrentWeekUserBetsAlert;
