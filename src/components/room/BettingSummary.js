import React from "react";
import { Card, Row, Col, Typography } from "antd";

const { Text } = Typography;

const BettingSummary = ({ selectedBets, nflOdds }) => {
  if (Object.keys(selectedBets).length === 0) {
    return null;
  }

  return (
    <Card
      size="small"
      title="Your Selected Bets"
      style={{ marginBottom: "16px", backgroundColor: "#f6ffed" }}
    >
      <Row gutter={[8, 8]}>
        {Object.entries(selectedBets).map(([gameId, bet]) => {
          const game = nflOdds.find((g) => g.game_id === gameId);
          if (!game) return null;

          return (
            <Col xs={24} sm={12} md={8} key={gameId}>
              <div
                style={{
                  padding: "8px",
                  border: "1px solid #b7eb8f",
                  borderRadius: "4px",
                  backgroundColor: "white",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "600" }}>
                  {game.teams.away?.abbreviation} @{" "}
                  {game.teams.home?.abbreviation}
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>
                  {bet.betType === "spread"
                    ? `${bet.teamChoice === "home" ? game.teams.home?.abbreviation : game.teams.away?.abbreviation} Spread`
                    : `${bet.teamChoice === "over" ? "Over" : "Under"} ${game.overUnder}`}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#389e0d",
                    fontWeight: "600",
                  }}
                >
                  {bet.points} point{bet.points !== 1 ? "s" : ""}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

export default BettingSummary;
