import React from "react";
import { Typography, Divider } from "antd";

const { Text } = Typography;

const BettingLines = ({ game, hasValidSpread, hasValidTotal, roomSport }) => {
  if (game.status?.state !== "pre") return null;

  return (
    <>
      <Divider style={{ margin: "12px 0" }} />
      <div>
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 12 }}>
            Spread:
          </Text>
          {hasValidSpread ? (
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {game.spreadDetails}
            </div>
          ) : (
            <div
              style={{
                fontSize: 11,
                color: "#faad14",
                marginTop: 4,
                backgroundColor: "#fffbe6",
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #ffe58f",
              }}
            >
              ⏳ Spread not set yet
              {hasValidTotal ? " — total bet still available" : ""}
            </div>
          )}
        </div>

        {game.overUnder && (
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 12 }}>
              Total:
            </Text>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {game.overUnder}
            </div>
          </div>
        )}
      </div>

      {/* Starting Pitchers - MLB only */}
      {roomSport === "MLB" &&
        (game.teams.away?.probableStartingPitcher ||
          game.teams.home?.probableStartingPitcher) && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div style={{ fontSize: 11, color: "#666" }}>
              <Text strong style={{ fontSize: 11 }}>
                Starting Pitchers:
              </Text>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  marginTop: 4,
                }}
              >
                {game.teams.away?.probableStartingPitcher?.athlete && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {game.teams.away.abbreviation}:
                    </span>
                    <span>
                      {game.teams.away.probableStartingPitcher.athlete
                        .shortName ||
                        game.teams.away.probableStartingPitcher.athlete
                          .displayName}
                    </span>
                    {game.teams.away.probableStartingPitcher.record && (
                      <span style={{ color: "#999" }}>
                        {game.teams.away.probableStartingPitcher.record}
                      </span>
                    )}
                  </div>
                )}
                {game.teams.home?.probableStartingPitcher?.athlete && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {game.teams.home.abbreviation}:
                    </span>
                    <span>
                      {game.teams.home.probableStartingPitcher.athlete
                        .shortName ||
                        game.teams.home.probableStartingPitcher.athlete
                          .displayName}
                    </span>
                    {game.teams.home.probableStartingPitcher.record && (
                      <span style={{ color: "#999" }}>
                        {game.teams.home.probableStartingPitcher.record}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
    </>
  );
};

export default BettingLines;
